package manifest

import (
	"os"
	"path/filepath"
	"testing"
)

// TestSelectorRejectsUnpinnedURI proves a key URI cannot omit the hardware-token serial.
func TestSelectorRejectsUnpinnedURI(t *testing.T) {
	if _, err := ParseSelector("pkcs11:token=a;id=%01;type=private"); err == nil {
		t.Fatal("serial required")
	}
}

// TestSelectorDecodesTheManifestCKAID proves the agent uses the URI's binary CKA_ID, not its textual escape sequence.
func TestSelectorDecodesTheManifestCKAID(t *testing.T) {
	selector, err := ParseSelector("pkcs11:token=a;serial=serial-1;id=%01%FE;type=private")
	if err != nil {
		t.Fatal(err)
	}
	if selector.TokenSerial != "serial-1" || string(selector.ID) != string([]byte{0x01, 0xfe}) {
		t.Fatalf("unexpected selector: %#v", selector)
	}
}

// TestTimelineRejectsEarlyRetirement preserves the full maximum-token-TTL plus skew overlap window.
func TestTimelineRejectsEarlyRetirement(t *testing.T) {
	entry := validEntry()
	if entry.Validate() != nil {
		t.Fatal("valid timeline rejected")
	}
	entry.RetireAfter = "2026-01-02T00:00:30Z"
	if entry.Validate() == nil {
		t.Fatal("retirement window accepted")
	}
}

// TestLoadRejectsDuplicateKids makes a retired or duplicate key unable to re-enter a manifest.
func TestLoadRejectsDuplicateKids(t *testing.T) {
	path := filepath.Join(t.TempDir(), "rotation.json")
	contents := `{"keys":[` + validEntryJSON("%01", "same") + `,` + validEntryJSON("%02", "same") + `]}`
	if err := os.WriteFile(path, []byte(contents), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(path); err == nil {
		t.Fatal("duplicate kid accepted")
	}
}

func validEntry() Entry {
	return Entry{PKCS11URI: "pkcs11:token=a;serial=s;id=%01;type=private", ExpectedKID: "kid", PublishNotBefore: "2026-01-01T00:00:00Z", SigningNotBefore: "2026-01-01T00:05:00Z", SigningNotAfter: "2026-01-02T00:00:00Z", RetireAfter: "2026-01-02T00:06:00Z"}
}

func validEntryJSON(id, kid string) string {
	return `{"pkcs11Uri":"pkcs11:token=a;serial=s;id=` + id + `;type=private","expectedKid":"` + kid + `","publishNotBefore":"2026-01-01T00:00:00Z","signingNotBefore":"2026-01-01T00:05:00Z","signingNotAfter":"2026-01-02T00:00:00Z","retireAfter":"2026-01-02T00:06:00Z"}`
}
