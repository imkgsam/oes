package main

import (
	"encoding/base64"
	"errors"
	"strings"
	"testing"
)

type fake struct{ closed bool }

// GetActiveKey returns the fake public-key error used to assert dispatch propagation.
func (f *fake) GetActiveKey() (KeyResponse, error) { return KeyResponse{}, ErrPrivateExport }

// ListPublishedKeys returns the same fake protected-provider error.
func (f *fake) ListPublishedKeys() ([]KeyResponse, error) { return nil, ErrPrivateExport }

// SignES256 does not sign because this fake only tests closed dispatch behavior.
func (f *fake) SignES256(string, []byte) ([]byte, error) { return nil, errors.New("unused") }

// GetExternalApiKeyVerifierStatus does not return readiness because this fake only tests dispatch behavior.
func (f *fake) GetExternalApiKeyVerifierStatus() (ExternalApiKeyVerifierStatusResponse, error) {
	return ExternalApiKeyVerifierStatusResponse{}, ErrPrivateExport
}

// ComputeExternalApiKeyVerifier does not compute a verifier because this fake only tests dispatch behavior.
func (f *fake) ComputeExternalApiKeyVerifier(string, string, string, string) (ExternalApiKeyVerifierResponse, error) {
	return ExternalApiKeyVerifierResponse{}, ErrPrivateExport
}

// Close records that agent shutdown releases provider state.
func (f *fake) Close() error { f.closed = true; return nil }

// TestBackendAlwaysCloses proves the public shutdown helper releases protected session state.
func TestBackendAlwaysCloses(t *testing.T) {
	fake := &fake{}
	_ = CloseBackend(fake)
	if !fake.closed {
		t.Fatal("session cleanup required")
	}
}

// TestDispatchUsesBackendOnly rejects unknown methods and forwards known calls to the fixed backend interface.
func TestDispatchUsesBackendOnly(t *testing.T) {
	fake := &fake{}
	if _, err := Dispatch(fake, "GetActiveKey", []byte(`{}`)); err != ErrPrivateExport {
		t.Fatal("backend error must propagate")
	}
	if _, err := Dispatch(fake, "SelectKey", []byte(`{}`)); err == nil {
		t.Fatal("arbitrary key method accepted")
	}
}

// TestVerifierRequestRejectsUnknownFields keeps callers from widening the fixed HMAC operation contract.
func TestVerifierRequestRejectsUnknownFields(t *testing.T) {
	identifier := base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("i", 18)))
	secret := base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("s", 32)))
	withEmptyVersion := []byte(`{"mode":"ISSUE","identifier":"` + identifier + `","secret":"` + secret + `","verifierKeyVersion":""}`)
	if _, err := parseVerifierRequest(withEmptyVersion); err == nil {
		t.Fatal("issue verifier request with version field accepted")
	}
	for _, field := range []string{"algorithm", "domain", "backendSelector", "message"} {
		raw := []byte(`{"mode":"ISSUE","identifier":"` + identifier + `","secret":"` + secret + `","` + field + `":"forbidden"}`)
		if _, err := parseVerifierRequest(raw); err == nil {
			t.Fatalf("unknown verifier request field %q accepted", field)
		}
	}
}
