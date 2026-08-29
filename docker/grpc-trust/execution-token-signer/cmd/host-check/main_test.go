package main

import (
	"bytes"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/miekg/pkcs11"
	"oes/execution-token-signer-agent/manifest"
)

// TestEntryBuildsAValidSixMinuteRetirementWindow proves host manifests keep active and overlap keys valid for the frozen retention interval.
func TestEntryBuildsAValidSixMinuteRetirementWindow(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	entry := entry("pkcs11:serial=serial;id=%01;type=private", "kid", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(5*time.Minute), now.Add(11*time.Minute))
	if err := entry.Validate(); err != nil {
		t.Fatal(err)
	}
}

// TestPersistentLocalManifestRetainsBoundedRuntimeWindow keeps runtime durability explicit without weakening the short lifecycle fixture.
func TestPersistentLocalManifestRetainsBoundedRuntimeWindow(t *testing.T) {
	output := t.TempDir() + "/manifest.json"
	before := time.Now().UTC()
	if err := runWriteManifest([]string{"--output", output, "--active-uri", "pkcs11:serial=serial;id=%01;type=private", "--active-kid", "active", "--overlap-uri", "pkcs11:serial=serial;id=%02;type=private", "--overlap-kid", "overlap"}, true); err != nil { t.Fatal(err) }
	encoded, err := os.ReadFile(output); if err != nil { t.Fatal(err) }
	var document manifest.Document
	if err := json.Unmarshal(encoded, &document); err != nil { t.Fatal(err) }
	signingAfter, _ := time.Parse(time.RFC3339, document.Keys[0].SigningNotAfter)
	retireAfter, _ := time.Parse(time.RFC3339, document.Keys[0].RetireAfter)
	if signingAfter.Before(before.Add(23*time.Hour)) || signingAfter.After(before.Add(25*time.Hour)) { t.Fatal("persistent signing window is not bounded to one local runtime day") }
	if retireAfter.Sub(signingAfter) < 24*time.Hour { t.Fatal("persistent retirement overlap is too short") }
}

// TestKeyPairTemplatesRequireSensitiveNonExtractablePrivateKeys proves the local token cannot be initialized with exportable test keys.
func TestKeyPairTemplatesRequireSensitiveNonExtractablePrivateKeys(t *testing.T) {
	_, private := keyPairTemplates([]byte{1}, "host-active")
	if !bytes.Equal(attribute(private, pkcs11.CKA_SENSITIVE), []byte{1}) || !bytes.Equal(attribute(private, pkcs11.CKA_EXTRACTABLE), []byte{0}) || !bytes.Equal(attribute(private, pkcs11.CKA_ID), []byte{1}) {
		t.Fatal("private key template weakened non-exportable signing requirements")
	}
}
