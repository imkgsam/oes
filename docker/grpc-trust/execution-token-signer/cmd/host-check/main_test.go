package main

import (
	"bytes"
	"testing"
	"time"

	"github.com/miekg/pkcs11"
)

// TestEntryBuildsAValidSixMinuteRetirementWindow proves host manifests keep active and overlap keys valid for the frozen retention interval.
func TestEntryBuildsAValidSixMinuteRetirementWindow(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	entry := entry("pkcs11:serial=serial;id=%01;type=private", "kid", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(5*time.Minute), now.Add(11*time.Minute))
	if err := entry.Validate(); err != nil {
		t.Fatal(err)
	}
}

// TestKeyPairTemplatesRequireSensitiveNonExtractablePrivateKeys proves the local token cannot be initialized with exportable test keys.
func TestKeyPairTemplatesRequireSensitiveNonExtractablePrivateKeys(t *testing.T) {
	_, private := keyPairTemplates([]byte{1}, "host-active")
	if !bytes.Equal(attribute(private, pkcs11.CKA_SENSITIVE), []byte{1}) || !bytes.Equal(attribute(private, pkcs11.CKA_EXTRACTABLE), []byte{0}) || !bytes.Equal(attribute(private, pkcs11.CKA_ID), []byte{1}) {
		t.Fatal("private key template weakened non-exportable signing requirements")
	}
}
