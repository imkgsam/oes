package main

import (
	"errors"

	verifiermanifest "oes/execution-token-signer-agent/verifiermanifest"
)

// resolvedVerifier pairs a validated manifest record with the only protected HMAC operation allowed for that key.
type resolvedVerifier struct {
	binding  verifierBinding
	response ExternalApiKeyVerifierVersionResponse
	compute  func([]byte) ([]byte, error)
}

// verifierBinding is the agent-internal result of manifest validation; request handlers cannot supply selectors.
type verifierBinding struct {
	Selector           verifiermanifest.Selector
	VerifierKeyVersion string
}

// BootstrapVerifierRuntime validates every manifest entry against its protected secret key before the agent serves requests.
func BootstrapVerifierRuntime(adapter *PKCS11Adapter, document verifiermanifest.Document, requiredKeyRef string, credential CredentialResolver) ([]resolvedVerifier, error) {
	if adapter == nil {
		return nil, errors.New("protected provider unavailable")
	}
	requiredSelector, err := verifiermanifest.ParseSelector(requiredKeyRef)
	if err != nil {
		return nil, errors.New("configured verifier key reference is invalid")
	}
	verifiers := make([]resolvedVerifier, 0, len(document.Versions))
	for _, entry := range document.Versions {
		binding, err := bindVerifier(entry)
		if err != nil {
			adapter.clearSession()
			return nil, err
		}
		if err := adapter.EnsureSession(binding.Selector.TokenSerial, credential); err != nil {
			return nil, err
		}
		resolved, err := resolveVerifier(adapter, entry, binding, credential)
		if err != nil {
			adapter.clearSession()
			return nil, err
		}
		verifiers = append(verifiers, resolved)
	}
	if len(verifiers) == 0 {
		return nil, errors.New("verifier manifest has no active version")
	}
	activeSelector, err := activeVerifierSelector(document)
	if err != nil {
		return nil, err
	}
	if activeSelector.TokenSerial != requiredSelector.TokenSerial || !bytesEqual(activeSelector.ID, requiredSelector.ID) {
		return nil, errors.New("configured verifier key reference is not active manifest key")
	}
	return verifiers, nil
}

// resolveVerifier validates the selected backend state and exposes only the safe readiness fields for that version.
func resolveVerifier(
	adapter *PKCS11Adapter,
	entry verifiermanifest.Entry,
	binding verifierBinding,
	credential CredentialResolver,
) (resolvedVerifier, error) {
	switch entry.State {
	case verifiermanifest.Active, verifiermanifest.VerifyOnly:
		if err := adapter.RequireNonExtractableSecretKey(binding.Selector.ID); err != nil {
			return resolvedVerifier{}, err
		}
		timeline, err := entry.ParseTimeline()
		if err != nil {
			return resolvedVerifier{}, err
		}
		keyBinding := binding
		response := ExternalApiKeyVerifierVersionResponse{
			VerifierKeyVersion:     binding.VerifierKeyVersion,
			State:                  string(entry.State),
			ActivatedAtUnixSeconds: timeline.ActivatedAt.Unix(),
		}
		if entry.State == verifiermanifest.VerifyOnly {
			response.VerifyOnlyAtUnixSeconds = timeline.VerifyOnlyAt.Unix()
			response.RetireAfterUnixSeconds = timeline.RetireAfter.Unix()
		}
		return resolvedVerifier{
			binding:  keyBinding,
			response: response,
			compute: func(input []byte) ([]byte, error) {
				if err := adapter.EnsureSession(keyBinding.Selector.TokenSerial, credential); err != nil {
					return nil, err
				}
				mac, err := adapter.ComputeHMACSHA256(keyBinding.Selector.ID, input)
				if err != nil {
					adapter.clearSession()
				}
				return mac, err
			},
		}, nil
	case verifiermanifest.CompromisedDisabled:
		evidence, err := entry.ParseCompromiseEvidence()
		if err != nil {
			return resolvedVerifier{}, err
		}
		if err := adapter.ConfirmHMACSHA256Unavailable(binding.Selector.ID); err != nil {
			return resolvedVerifier{}, err
		}
		return resolvedVerifier{
			binding: binding,
			response: ExternalApiKeyVerifierVersionResponse{
				VerifierKeyVersion:    binding.VerifierKeyVersion,
				State:                 string(entry.State),
				IncidentReference:     evidence.IncidentReference,
				OccurredAtUnixSeconds: evidence.OccurredAt.Unix(),
				StateRevision:         evidence.StateRevision,
			},
		}, nil
	default:
		return resolvedVerifier{}, errors.New("verifier state invalid")
	}
}

// activeVerifierSelector resolves the unique active manifest selector that must match the configured issue key reference.
func activeVerifierSelector(document verifiermanifest.Document) (verifiermanifest.Selector, error) {
	for _, entry := range document.Versions {
		if entry.State != verifiermanifest.Active {
			continue
		}
		return verifiermanifest.ParseSelector(entry.PKCS11URI)
	}
	return verifiermanifest.Selector{}, errors.New("verifier manifest has no active version")
}

// bindVerifier freezes one validated manifest entry before it can reach a PKCS#11 lookup.
func bindVerifier(entry verifiermanifest.Entry) (verifierBinding, error) {
	if err := entry.Validate(); err != nil {
		return verifierBinding{}, err
	}
	selector, err := verifiermanifest.ParseSelector(entry.PKCS11URI)
	if err != nil || entry.VerifierKeyVersion == "" {
		return verifierBinding{}, errors.New("invalid verifier manifest binding")
	}
	return verifierBinding{Selector: selector, VerifierKeyVersion: entry.VerifierKeyVersion}, nil
}

// bytesEqual compares two binary selectors without making their content observable through formatting.
func bytesEqual(left, right []byte) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
