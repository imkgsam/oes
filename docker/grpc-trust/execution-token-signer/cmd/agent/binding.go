package main

import (
	"errors"

	"oes/execution-token-signer-agent/manifest"
)

// Binding is the agent-internal result of manifest validation; request handlers cannot supply selectors.
type Binding struct {
	Selector    manifest.Selector
	ExpectedKID string
}

// Bind freezes one validated manifest entry before it can reach a PKCS#11 lookup.
func Bind(entry manifest.Entry) (Binding, error) {
	if err := entry.Validate(); err != nil {
		return Binding{}, err
	}
	selector, err := manifest.ParseSelector(entry.PKCS11URI)
	if err != nil || entry.ExpectedKID == "" {
		return Binding{}, errors.New("invalid manifest binding")
	}
	return Binding{Selector: selector, ExpectedKID: entry.ExpectedKID}, nil
}

// VerifyPublicKid prevents a manifest/HSM public-key mismatch from entering JWKS or signing paths.
func (b Binding) VerifyPublicKid(x, y string) error {
	if b.ExpectedKID == "" || ES256Kid(x, y) != b.ExpectedKID {
		return errors.New("manifest expected kid mismatch")
	}
	return nil
}
