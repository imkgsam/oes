package main

import (
	"bytes"
	"errors"
	"os"
	"time"

	"oes/execution-token-signer-agent/manifest"
)

// CredentialResolver resolves optional backend credentials entirely inside the signer process.
type CredentialResolver interface {
	Resolve() ([]byte, error)
}

// FileCredentialResolver reads the agent-only PIN file for one lease refresh and never retains its content.
type FileCredentialResolver struct {
	path string
}

// Resolve loads a non-empty permission-restricted credential file into a caller-zeroed buffer.
func (r FileCredentialResolver) Resolve() ([]byte, error) {
	info, err := os.Stat(r.path)
	if err != nil || info.Mode().Perm()&0o077 != 0 {
		return nil, errors.New("protected credential file unavailable")
	}
	raw, err := os.ReadFile(r.path)
	if err != nil {
		return nil, err
	}
	value := append([]byte(nil), bytes.TrimSpace(raw)...)
	zero(raw)
	if len(value) == 0 {
		return nil, errors.New("protected credential unavailable")
	}
	return value, nil
}

// resolvedKey pairs validated public facts with the only internal signing operation permitted for that key.
type resolvedKey struct {
	binding  Binding
	response KeyResponse
	sign     func([]byte) ([]byte, error)
}

// Runtime is the manifest-derived signer backend that owns time-window enforcement and the PKCS#11 adapter.
type Runtime struct {
	keys    []resolvedKey
	now     func() time.Time
	adapter *PKCS11Adapter
}

// NewRuntime creates an already-validated runtime for tests or the PKCS#11 bootstrap path.
func NewRuntime(keys []resolvedKey, now time.Time) *Runtime {
	return &Runtime{keys: append([]resolvedKey(nil), keys...), now: func() time.Time { return now }}
}

// BootstrapRuntime validates every manifest entry against its public and private PKCS#11 objects before serving requests.
func BootstrapRuntime(adapter *PKCS11Adapter, document manifest.Document, requiredKeyRef string, credential CredentialResolver) (*Runtime, error) {
	if adapter == nil {
		return nil, errors.New("protected provider unavailable")
	}
	requiredSelector, err := manifest.ParseSelector(requiredKeyRef)
	if err != nil {
		return nil, errors.New("configured PKCS#11 key reference is invalid")
	}
	keys := make([]resolvedKey, 0, len(document.Keys))
	for _, entry := range document.Keys {
		binding, err := Bind(entry)
		if err != nil {
			adapter.clearSession()
			return nil, err
		}
		if err := adapter.EnsureSession(binding.Selector.TokenSerial, credential); err != nil {
			return nil, err
		}
		if err := adapter.RequireNonExtractablePrivateKey(binding.Selector.ID); err != nil {
			adapter.clearSession()
			return nil, err
		}
		publicJWK, err := adapter.PublicJWK(binding)
		if err != nil || binding.VerifyPublicKid(publicJWK.X, publicJWK.Y) != nil {
			adapter.clearSession()
			return nil, errors.New("manifest public key mismatch")
		}
		challenge := []byte("oes-execution-signer-bootstrap:" + binding.ExpectedKID)
		signature, err := adapter.SignBindingES256(binding, challenge)
		if err != nil || verifyPublicSignature(publicJWK, challenge, signature) != nil {
			adapter.clearSession()
			return nil, errors.New("manifest public/private key mismatch")
		}
		timeline, err := entry.ParseTimeline()
		if err != nil {
			adapter.clearSession()
			return nil, err
		}
		keyBinding := binding
		keys = append(keys, resolvedKey{
			binding:  keyBinding,
			response: KeyResponse{KID: binding.ExpectedKID, PublicJWK: publicJWK, PublishNotBeforeUnixSeconds: timeline.PublishNotBefore.Unix(), SigningNotBeforeUnixSeconds: timeline.SigningNotBefore.Unix(), SigningNotAfterUnixSeconds: timeline.SigningNotAfter.Unix(), RetireAfterUnixSeconds: timeline.RetireAfter.Unix()},
			sign: func(input []byte) ([]byte, error) {
				if err := adapter.EnsureSession(keyBinding.Selector.TokenSerial, credential); err != nil {
					return nil, err
				}
				signature, err := adapter.SignBindingES256(keyBinding, input)
				if err != nil {
					adapter.clearSession()
				}
				return signature, err
			},
		})
	}
	runtime := &Runtime{keys: keys, now: adapter.clock, adapter: adapter}
	active, err := runtime.activeKey(runtime.clock())
	if err != nil {
		adapter.clearSession()
		return nil, err
	}
	if active.binding.Selector.TokenSerial != requiredSelector.TokenSerial || !bytes.Equal(active.binding.Selector.ID, requiredSelector.ID) {
		adapter.clearSession()
		return nil, errors.New("configured PKCS#11 key reference is not active manifest key")
	}
	return runtime, nil
}

// GetActiveKey returns exactly one currently signable public key or fails readiness closed.
func (r *Runtime) GetActiveKey() (KeyResponse, error) {
	active, err := r.activeKey(r.clock())
	if err != nil {
		return KeyResponse{}, err
	}
	return active.response, nil
}

// ListPublishedKeys returns all and only keys within their public verification overlap windows.
func (r *Runtime) ListPublishedKeys() ([]KeyResponse, error) {
	now := r.clock()
	if _, err := r.activeKey(now); err != nil {
		return nil, err
	}
	published := make([]KeyResponse, 0, len(r.keys))
	for _, key := range r.keys {
		if key.response.PublishNotBeforeUnixSeconds <= now.Unix() && now.Unix() < key.response.RetireAfterUnixSeconds {
			published = append(published, key.response)
		}
	}
	if len(published) == 0 {
		return nil, errors.New("no published signing keys")
	}
	return published, nil
}

// SignES256 accepts only the currently active manifest kid and delegates the JWS input to its protected sign operation.
func (r *Runtime) SignES256(kid string, input []byte) ([]byte, error) {
	active, err := r.activeKey(r.clock())
	if err != nil || active.response.KID != kid || len(input) == 0 || active.sign == nil {
		return nil, errors.New("manifest selected signing key unavailable")
	}
	return active.sign(input)
}

// Close clears the leased PKCS#11 session and finalizes the module once the agent stops.
func (r *Runtime) Close() error {
	if r == nil || r.adapter == nil {
		return nil
	}
	return r.adapter.Close()
}

// activeKey verifies the one-and-only-one signing window instead of choosing a key by manifest order.
func (r *Runtime) activeKey(now time.Time) (resolvedKey, error) {
	var active *resolvedKey
	for index := range r.keys {
		key := &r.keys[index]
		if key.response.SigningNotBeforeUnixSeconds <= now.Unix() && now.Unix() < key.response.SigningNotAfterUnixSeconds {
			if active != nil {
				return resolvedKey{}, errors.New("rotation manifest has multiple active keys")
			}
			active = key
		}
	}
	if active == nil {
		return resolvedKey{}, errors.New("rotation manifest has no active key")
	}
	return *active, nil
}

// clock provides the runtime time source while preserving deterministic pure-runtime tests.
func (r *Runtime) clock() time.Time {
	if r == nil || r.now == nil {
		return time.Now()
	}
	return r.now()
}
