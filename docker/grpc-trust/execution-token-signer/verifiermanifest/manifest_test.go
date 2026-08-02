package verifiermanifest

import (
	"os"
	"path/filepath"
	"testing"
)

// TestSelectorRejectsWrongObjectType proves a verifier key cannot bind to a signing-key selector.
func TestSelectorRejectsWrongObjectType(t *testing.T) {
	if _, err := ParseSelector("pkcs11:token=a;serial=s;id=%01;type=private"); err == nil {
		t.Fatal("secret-key selector required")
	}
}

// TestValidateRequiresExactlyOneActiveVersion proves the verifier manifest cannot issue from zero or multiple versions.
func TestValidateRequiresExactlyOneActiveVersion(t *testing.T) {
	document := Document{Versions: []Entry{
		validEntry("%11", "verifier-v1", VerifyOnly),
		validCompromisedEntry("%13", "verifier-v0"),
	}}
	if document.Validate() == nil {
		t.Fatal("missing active version accepted")
	}
}

// TestLoadRejectsDuplicateVersions keeps a retired or duplicated logical version from silently re-entering the manifest.
func TestLoadRejectsDuplicateVersions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "verifier.json")
	contents := `{"versions":[` + validEntryJSON("%11", "same", "ACTIVE") + `,` + validEntryJSON("%12", "same", "VERIFY_ONLY") + `]}`
	if err := os.WriteFile(path, []byte(contents), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(path); err == nil {
		t.Fatal("duplicate verifier version accepted")
	}
}

// TestActiveEntryRejectsVerifyOnlyLifecycleFields prevents one manifest record from expressing contradictory states.
func TestActiveEntryRejectsVerifyOnlyLifecycleFields(t *testing.T) {
	entry := validEntry("%11", "verifier-v1", Active)
	entry.VerifyOnlyAt = "2026-08-02T00:00:00Z"
	entry.RetireAfter = "2026-08-03T00:00:00Z"
	if entry.Validate() == nil {
		t.Fatal("active verifier with verify-only lifecycle accepted")
	}
}

// TestCompromisedEntryRequiresSafeEvidence proves terminal compromised status cannot exist without immutable incident facts.
func TestCompromisedEntryRequiresSafeEvidence(t *testing.T) {
	entry := validCompromisedEntry("%13", "verifier-v0")
	entry.IncidentReference = ""
	if entry.Validate() == nil {
		t.Fatal("compromised verifier without incident reference accepted")
	}
}

// TestCompromisedEntryRejectsLifecycleTimeline proves a terminal compromised version cannot also claim issue or verify readiness.
func TestCompromisedEntryRejectsLifecycleTimeline(t *testing.T) {
	entry := validCompromisedEntry("%13", "verifier-v0")
	entry.ActivatedAt = "2026-08-01T00:00:00Z"
	if entry.Validate() == nil {
		t.Fatal("compromised verifier with activation timeline accepted")
	}
}

func validEntry(id, version string, state State) Entry {
	entry := Entry{
		PKCS11URI:          "pkcs11:token=a;serial=s;id=" + id + ";type=secret-key",
		VerifierKeyVersion: version,
		State:              state,
		ActivatedAt:        "2026-08-01T00:00:00Z",
	}
	if state == VerifyOnly {
		entry.VerifyOnlyAt = "2026-08-02T00:00:00Z"
		entry.RetireAfter = "2026-08-03T00:00:00Z"
	}
	return entry
}

func validCompromisedEntry(id, version string) Entry {
	return Entry{
		PKCS11URI:          "pkcs11:token=a;serial=s;id=" + id + ";type=secret-key",
		VerifierKeyVersion: version,
		State:              CompromisedDisabled,
		IncidentReference:  "INC-1",
		OccurredAt:         "2026-08-01T12:00:00Z",
		StateRevision:      "rev-7",
	}
}

func validEntryJSON(id, version, state string) string {
	value := `{"pkcs11Uri":"pkcs11:token=a;serial=s;id=` + id + `;type=secret-key","verifierKeyVersion":"` + version + `","state":"` + state + `"`
	if state == "ACTIVE" {
		value += `,"activatedAt":"2026-08-01T00:00:00Z"`
	}
	if state == "VERIFY_ONLY" {
		value += `,"activatedAt":"2026-08-01T00:00:00Z","verifyOnlyAt":"2026-08-02T00:00:00Z","retireAfter":"2026-08-03T00:00:00Z"`
	}
	if state == "COMPROMISED_DISABLED" {
		value += `,"incidentReference":"INC-1","occurredAt":"2026-08-01T12:00:00Z","stateRevision":"rev-7"`
	}
	return value + `}`
}
