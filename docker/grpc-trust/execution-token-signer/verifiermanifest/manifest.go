// Package verifiermanifest validates deployment-owned external API-key verifier selectors and lifecycle state before HSM use.
package verifiermanifest

import (
	"encoding/json"
	"errors"
	"io"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
)

var incidentReferencePattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$`)

// Selector is the binary PKCS#11 identity that binds one verifier-manifest entry to one HMAC secret object.
type Selector struct {
	TokenSerial string
	ID          []byte
}

// ParseSelector accepts only a secret-key URI pinned by token serial and binary CKA_ID.
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
	if values["serial"] == "" || values["id"] == "" || values["type"] != "secret-key" {
		return Selector{}, errors.New("PKCS#11 URI must pin serial/id/type=secret-key")
	}
	return Selector{TokenSerial: values["serial"], ID: []byte(values["id"])}, nil
}

// State is the only allowed provider-visible lifecycle state for a verifier version.
type State string

const (
	Active              State = "ACTIVE"
	VerifyOnly          State = "VERIFY_ONLY"
	CompromisedDisabled State = "COMPROMISED_DISABLED"
)

// Entry is one deployment-owned external API-key verifier version record.
type Entry struct {
	PKCS11URI          string `json:"pkcs11Uri"`
	VerifierKeyVersion string `json:"verifierKeyVersion"`
	State              State  `json:"state"`
	ActivatedAt        string `json:"activatedAt,omitempty"`
	VerifyOnlyAt       string `json:"verifyOnlyAt,omitempty"`
	RetireAfter        string `json:"retireAfter,omitempty"`
	IncidentReference  string `json:"incidentReference,omitempty"`
	OccurredAt         string `json:"occurredAt,omitempty"`
	StateRevision      string `json:"stateRevision,omitempty"`
}

// Timeline carries the parsed UTC lifecycle boundaries for one immutable verifier-version record.
type Timeline struct {
	ActivatedAt  time.Time
	VerifyOnlyAt time.Time
	RetireAfter  time.Time
}

// CompromiseEvidence carries the parsed safe evidence for one terminal compromised-disabled version.
type CompromiseEvidence struct {
	IncidentReference string
	OccurredAt        time.Time
	StateRevision     string
}

// ParseTimeline converts the manifest's RFC3339 UTC values into comparable lifecycle boundaries.
func (e Entry) ParseTimeline() (Timeline, error) {
	parseRequiredUTC := func(value string) (time.Time, error) {
		if !strings.HasSuffix(value, "Z") {
			return time.Time{}, errors.New("verifier timestamp must be UTC")
		}
		return time.Parse(time.RFC3339, value)
	}
	activatedAt, err := parseRequiredUTC(e.ActivatedAt)
	if err != nil {
		return Timeline{}, err
	}
	timeline := Timeline{ActivatedAt: activatedAt}
	if e.State == VerifyOnly {
		verifyOnlyAt, err := parseRequiredUTC(e.VerifyOnlyAt)
		if err != nil {
			return Timeline{}, err
		}
		retireAfter, err := parseRequiredUTC(e.RetireAfter)
		if err != nil {
			return Timeline{}, err
		}
		if verifyOnlyAt.Before(activatedAt) || !retireAfter.After(verifyOnlyAt) {
			return Timeline{}, errors.New("invalid verifier lifecycle timeline")
		}
		timeline.VerifyOnlyAt = verifyOnlyAt
		timeline.RetireAfter = retireAfter
	}
	return timeline, nil
}

// ParseCompromiseEvidence converts the manifest's safe terminal evidence into immutable runtime facts.
func (e Entry) ParseCompromiseEvidence() (CompromiseEvidence, error) {
	if !incidentReferencePattern.MatchString(e.IncidentReference) {
		return CompromiseEvidence{}, errors.New("invalid verifier incident reference")
	}
	if e.StateRevision == "" {
		return CompromiseEvidence{}, errors.New("verifier stateRevision required")
	}
	if !strings.HasSuffix(e.OccurredAt, "Z") {
		return CompromiseEvidence{}, errors.New("verifier timestamp must be UTC")
	}
	occurredAt, err := time.Parse(time.RFC3339, e.OccurredAt)
	if err != nil {
		return CompromiseEvidence{}, err
	}
	return CompromiseEvidence{
		IncidentReference: e.IncidentReference,
		OccurredAt:        occurredAt,
		StateRevision:     e.StateRevision,
	}, nil
}

// Validate rejects incomplete selectors, missing logical versions, and invalid lifecycle combinations.
func (e Entry) Validate() error {
	if _, err := ParseSelector(e.PKCS11URI); err != nil {
		return err
	}
	if e.VerifierKeyVersion == "" {
		return errors.New("verifierKeyVersion required")
	}
	switch e.State {
	case Active:
		if e.VerifyOnlyAt != "" || e.RetireAfter != "" {
			return errors.New("active verifier cannot define verify-only lifecycle")
		}
		if e.IncidentReference != "" || e.OccurredAt != "" || e.StateRevision != "" {
			return errors.New("active verifier cannot define compromise evidence")
		}
		_, err := e.ParseTimeline()
		return err
	case VerifyOnly:
		if e.IncidentReference != "" || e.OccurredAt != "" || e.StateRevision != "" {
			return errors.New("verify-only verifier cannot define compromise evidence")
		}
		_, err := e.ParseTimeline()
		return err
	case CompromisedDisabled:
		if e.ActivatedAt != "" || e.VerifyOnlyAt != "" || e.RetireAfter != "" {
			return errors.New("compromised-disabled verifier cannot define lifecycle timeline")
		}
		_, err := e.ParseCompromiseEvidence()
		return err
	default:
		return errors.New("verifier state invalid")
	}
}

// Document is the complete read-only verifier manifest mounted only into the signer agent.
type Document struct {
	Versions []Entry `json:"versions"`
}

// Validate rejects duplicate versions, duplicate selectors, and any manifest without exactly one active issue version.
func (d Document) Validate() error {
	if len(d.Versions) == 0 {
		return errors.New("verifier manifest requires versions")
	}
	versions := map[string]struct{}{}
	selectors := map[string]struct{}{}
	activeCount := 0
	for _, entry := range d.Versions {
		if err := entry.Validate(); err != nil {
			return err
		}
		if _, exists := versions[entry.VerifierKeyVersion]; exists {
			return errors.New("verifier manifest repeats version")
		}
		if _, exists := selectors[entry.PKCS11URI]; exists {
			return errors.New("verifier manifest repeats selector")
		}
		if entry.State == Active {
			activeCount++
		}
		versions[entry.VerifierKeyVersion] = struct{}{}
		selectors[entry.PKCS11URI] = struct{}{}
	}
	if activeCount != 1 {
		return errors.New("verifier manifest requires exactly one active version")
	}
	return nil
}

// Load reads one strict deployment-owned verifier manifest and validates it before provider initialization continues.
func Load(path string) (Document, error) {
	if path == "" {
		return Document{}, errors.New("verifier manifest path required")
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
		return Document{}, errors.New("verifier manifest has trailing content")
	}
	if err := document.Validate(); err != nil {
		return Document{}, err
	}
	return document, nil
}
