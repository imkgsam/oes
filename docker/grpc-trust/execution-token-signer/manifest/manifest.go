// Package manifest validates deployment-owned PKCS#11 selectors and rotation timelines before any HSM session opens.
package manifest

import (
	"encoding/json"
	"errors"
	"io"
	"net/url"
	"os"
	"strings"
	"time"
)

const minimumRetirementOverlap = 6 * time.Minute

// Selector is the binary PKCS#11 identity that binds a manifest entry to one token and key pair.
type Selector struct {
	TokenSerial string
	ID          []byte
}

// ParseSelector accepts only a private-key URI pinned by token serial and binary CKA_ID.
func ParseSelector(raw string) (Selector, error) {
	if !strings.HasPrefix(raw, "pkcs11:") {
		return Selector{}, errors.New("invalid PKCS#11 URI")
	}
	values := map[string]string{}
	for _, part := range strings.Split(strings.TrimPrefix(raw, "pkcs11:"), ";") {
		pair := strings.SplitN(part, "=", 2)
		if len(pair) != 2 || pair[0] == "" || pair[1] == "" || values[pair[0]] != "" {
			return Selector{}, errors.New("invalid PKCS#11 URI attribute")
		}
		decoded, err := url.PathUnescape(pair[1])
		if err != nil || decoded == "" {
			return Selector{}, errors.New("invalid PKCS#11 URI escape")
		}
		values[pair[0]] = decoded
	}
	if values["serial"] == "" || values["id"] == "" || values["type"] != "private" {
		return Selector{}, errors.New("PKCS#11 URI must pin serial/id/type=private")
	}
	return Selector{TokenSerial: values["serial"], ID: []byte(values["id"])}, nil
}

// Entry is one deployment-owned public-key publication and signing interval.
type Entry struct {
	PKCS11URI        string `json:"pkcs11Uri"`
	ExpectedKID      string `json:"expectedKid"`
	PublishNotBefore string `json:"publishNotBefore"`
	SigningNotBefore string `json:"signingNotBefore"`
	SigningNotAfter  string `json:"signingNotAfter"`
	RetireAfter      string `json:"retireAfter"`
}

// Timeline carries parsed UTC boundaries for one immutable signer record.
type Timeline struct {
	PublishNotBefore time.Time
	SigningNotBefore time.Time
	SigningNotAfter  time.Time
	RetireAfter      time.Time
}

// ParseTimeline converts the manifest's exact RFC3339 UTC values into comparable boundaries.
func (e Entry) ParseTimeline() (Timeline, error) {
	parse := func(value string) (time.Time, error) {
		if !strings.HasSuffix(value, "Z") {
			return time.Time{}, errors.New("rotation timestamp must be UTC")
		}
		return time.Parse(time.RFC3339, value)
	}
	publish, err := parse(e.PublishNotBefore)
	if err != nil {
		return Timeline{}, err
	}
	signing, err := parse(e.SigningNotBefore)
	if err != nil {
		return Timeline{}, err
	}
	signingEnd, err := parse(e.SigningNotAfter)
	if err != nil {
		return Timeline{}, err
	}
	retire, err := parse(e.RetireAfter)
	if err != nil {
		return Timeline{}, err
	}
	if signing.Before(publish) || !signingEnd.After(signing) || retire.Before(signingEnd.Add(minimumRetirementOverlap)) {
		return Timeline{}, errors.New("invalid rotation timeline")
	}
	return Timeline{PublishNotBefore: publish, SigningNotBefore: signing, SigningNotAfter: signingEnd, RetireAfter: retire}, nil
}

// Validate rejects incomplete selectors, missing expected kids, and unsafe key-retirement windows.
func (e Entry) Validate() error {
	if _, err := ParseSelector(e.PKCS11URI); err != nil {
		return err
	}
	if e.ExpectedKID == "" {
		return errors.New("kid required")
	}
	_, err := e.ParseTimeline()
	return err
}

// Document is the complete read-only rotation manifest mounted only into the signer agent.
type Document struct {
	Keys []Entry `json:"keys"`
}

// Validate rejects duplicate key identities before the agent can inspect any PKCS#11 object.
func (d Document) Validate() error {
	if len(d.Keys) == 0 {
		return errors.New("rotation manifest requires keys")
	}
	kids := map[string]struct{}{}
	selectors := map[string]struct{}{}
	for _, entry := range d.Keys {
		if err := entry.Validate(); err != nil {
			return err
		}
		if _, exists := kids[entry.ExpectedKID]; exists {
			return errors.New("rotation manifest repeats kid")
		}
		if _, exists := selectors[entry.PKCS11URI]; exists {
			return errors.New("rotation manifest repeats selector")
		}
		kids[entry.ExpectedKID] = struct{}{}
		selectors[entry.PKCS11URI] = struct{}{}
	}
	return nil
}

// Load reads one strict deployment-owned manifest and validates it before provider initialization continues.
func Load(path string) (Document, error) {
	if path == "" {
		return Document{}, errors.New("rotation manifest path required")
	}
	file, err := os.Open(path)
	if err != nil {
		return Document{}, err
	}
	defer file.Close()
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	var document Document
	if err := decoder.Decode(&document); err != nil {
		return Document{}, err
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return Document{}, errors.New("rotation manifest has trailing content")
	}
	if err := document.Validate(); err != nil {
		return Document{}, err
	}
	return document, nil
}
