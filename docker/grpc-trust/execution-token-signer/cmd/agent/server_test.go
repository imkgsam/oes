package main

import (
	"os"
	"path/filepath"
	"testing"
)

// TestConfiguredSocketRequired rejects a missing pod-local UDS endpoint before agent bootstrap.
func TestConfiguredSocketRequired(t *testing.T) {
	if err := validateConfig("", "module", "ref", "manifest", "verifier-manifest", "verifier-ref"); err == nil {
		t.Fatal("socket must be required")
	}
}

// TestLeaseDurationRejectsUnsafeValues keeps credential sessions bounded and refreshable.
func TestLeaseDurationRejectsUnsafeValues(t *testing.T) {
	if _, err := parseLeaseDuration("0"); err == nil {
		t.Fatal("zero lease accepted")
	}
}

// TestVerifierConfigRequired rejects a missing verifier manifest or HMAC key reference before agent bootstrap.
func TestVerifierConfigRequired(t *testing.T) {
	if err := validateConfig("/tmp/socket", "module", "ref", "manifest", "", ""); err == nil {
		t.Fatal("verifier config must be required")
	}
}

// TestConfiguredCredentialsRejectWeakVerifierFile proves a reused PKCS11 session cannot bypass verifier credential validation.
func TestConfiguredCredentialsRejectWeakVerifierFile(t *testing.T) {
	directory := t.TempDir()
	signerPath := filepath.Join(directory, "signer-pin")
	verifierPath := filepath.Join(directory, "verifier-pin")
	if err := os.WriteFile(signerPath, []byte("secret\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(verifierPath, []byte("secret\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := validateConfiguredCredentials(FileCredentialResolver{path: signerPath}, FileCredentialResolver{path: verifierPath}); err == nil {
		t.Fatal("weak verifier credential accepted")
	}
}
