// Package main contains the agent-owned PKCS#11 boundary; Auth never receives a private key or raw session handle.
package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
)

// Backend is the closed public-key, ES256, and API-key verifier operation set exposed through the signer socket.
type Backend interface {
	GetActiveKey() (KeyResponse, error)
	ListPublishedKeys() ([]KeyResponse, error)
	SignES256(kid string, input []byte) ([]byte, error)
	GetExternalApiKeyVerifierStatus() (ExternalApiKeyVerifierStatusResponse, error)
	ComputeExternalApiKeyVerifier(mode string, identifier string, secret string, verifierKeyVersion string) (ExternalApiKeyVerifierResponse, error)
	Close() error
}

// PublicJWK is the public ES256 verification material returned by the provider without private key data.
type PublicJWK struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

// KeyResponse is the complete public rotation fact record exposed to Auth readiness and JWKS publication.
type KeyResponse struct {
	KID                         string    `json:"kid"`
	PublicJWK                   PublicJWK `json:"publicJwk"`
	PublishNotBeforeUnixSeconds int64     `json:"publishNotBeforeUnixSeconds"`
	SigningNotBeforeUnixSeconds int64     `json:"signingNotBeforeUnixSeconds"`
	SigningNotAfterUnixSeconds  int64     `json:"signingNotAfterUnixSeconds"`
	RetireAfterUnixSeconds      int64     `json:"retireAfterUnixSeconds"`
}

// ExternalApiKeyVerifierVersionResponse is the safe readiness record returned for one verifier version.
type ExternalApiKeyVerifierVersionResponse struct {
	VerifierKeyVersion      string `json:"verifierKeyVersion"`
	State                   string `json:"state"`
	ActivatedAtUnixSeconds  int64  `json:"activatedAtUnixSeconds,omitempty"`
	VerifyOnlyAtUnixSeconds int64  `json:"verifyOnlyAtUnixSeconds,omitempty"`
	RetireAfterUnixSeconds  int64  `json:"retireAfterUnixSeconds,omitempty"`
	IncidentReference       string `json:"incidentReference,omitempty"`
	OccurredAtUnixSeconds   int64  `json:"occurredAtUnixSeconds,omitempty"`
	StateRevision           string `json:"stateRevision,omitempty"`
}

// ExternalApiKeyVerifierStatusResponse returns readiness facts without exposing HMAC material or backend selectors.
type ExternalApiKeyVerifierStatusResponse struct {
	ActiveVerifierKeyVersion string                                  `json:"activeVerifierKeyVersion"`
	Versions                 []ExternalApiKeyVerifierVersionResponse `json:"versions"`
}

// ExternalApiKeyVerifierResponse returns only a base64url fixed-width HMAC verifier and its logical version.
type ExternalApiKeyVerifierResponse struct {
	Verifier           string `json:"verifier"`
	VerifierKeyVersion string `json:"verifierKeyVersion"`
}

// SignResponse returns only a base64url fixed-width JOSE ES256 signature.
type SignResponse struct {
	SignatureBase64URL string `json:"signatureBase64url"`
}

// Dispatch maps the frozen JSON-RPC methods to the agent-owned backend without selector control.
func Dispatch(backend Backend, method string, params json.RawMessage) (any, error) {
	if backend == nil {
		return nil, errors.New("protected provider unavailable")
	}
	switch method {
	case "GetActiveKey":
		if err := requireEmptyObject(params); err != nil {
			return nil, err
		}
		return backend.GetActiveKey()
	case "ListPublishedKeys":
		if err := requireEmptyObject(params); err != nil {
			return nil, err
		}
		return backend.ListPublishedKeys()
	case "SignEs256":
		request, err := parseSignRequest(params)
		if err != nil {
			return nil, err
		}
		signature, err := backend.SignES256(request.KID, request.Input)
		if err != nil || len(signature) != 64 {
			return nil, errors.New("protected ES256 signing failed")
		}
		return SignResponse{SignatureBase64URL: base64.RawURLEncoding.EncodeToString(signature)}, nil
	case "GetExternalApiKeyVerifierStatus":
		if err := requireEmptyObject(params); err != nil {
			return nil, err
		}
		return backend.GetExternalApiKeyVerifierStatus()
	case "ComputeExternalApiKeyVerifier":
		request, err := parseVerifierRequest(params)
		if err != nil {
			return nil, err
		}
		response, err := backend.ComputeExternalApiKeyVerifier(request.Mode, request.Identifier, request.Secret, request.VerifierKeyVersion)
		if err != nil || response.Verifier == "" || response.VerifierKeyVersion == "" {
			return nil, errors.New("protected verifier computation failed")
		}
		return response, nil
	default:
		return nil, errors.New("method forbidden")
	}
}

// CloseBackend closes agent-owned provider state during shutdown without exposing session control to callers.
func CloseBackend(backend Backend) error {
	if backend == nil {
		return nil
	}
	return backend.Close()
}

// ErrPrivateExport is the explicit invariant used by tests and callers that private-key export is impossible.
var ErrPrivateExport = errors.New("private key export is forbidden")

type signRequest struct {
	KID   string
	Input []byte
}

type verifierRequest struct {
	Mode               string
	Identifier         string
	Secret             string
	VerifierKeyVersion string
}

// requireEmptyObject rejects parameters for read operations so request data cannot alter a manifest selection.
func requireEmptyObject(raw json.RawMessage) error {
	var object map[string]json.RawMessage
	if len(raw) == 0 || json.Unmarshal(raw, &object) != nil || object == nil || len(object) != 0 {
		return errors.New("read operation parameters are forbidden")
	}
	return nil
}

// parseSignRequest accepts exactly the frozen kid and base64url JWS signing-input fields.
func parseSignRequest(raw json.RawMessage) (signRequest, error) {
	var object map[string]json.RawMessage
	if json.Unmarshal(raw, &object) != nil || len(object) != 2 {
		return signRequest{}, errors.New("invalid signing request")
	}
	var kid, encoded string
	if json.Unmarshal(object["kid"], &kid) != nil || json.Unmarshal(object["signingInputBase64url"], &encoded) != nil || kid == "" || encoded == "" {
		return signRequest{}, errors.New("invalid signing request")
	}
	input, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil || base64.RawURLEncoding.EncodeToString(input) != encoded {
		return signRequest{}, errors.New("invalid signing input")
	}
	return signRequest{KID: kid, Input: input}, nil
}

// parseVerifierRequest accepts only the frozen API-key verifier mode and canonical identifier/secret inputs.
func parseVerifierRequest(raw json.RawMessage) (verifierRequest, error) {
	var object map[string]json.RawMessage
	if json.Unmarshal(raw, &object) != nil || len(object) < 3 || len(object) > 4 {
		return verifierRequest{}, errors.New("invalid verifier request")
	}
	allowed := map[string]struct{}{
		"mode": {}, "identifier": {}, "secret": {}, "verifierKeyVersion": {},
	}
	for field := range object {
		if _, ok := allowed[field]; !ok {
			return verifierRequest{}, errors.New("invalid verifier request")
		}
	}
	var mode, identifier, secret, verifierKeyVersion string
	if json.Unmarshal(object["mode"], &mode) != nil || json.Unmarshal(object["identifier"], &identifier) != nil || json.Unmarshal(object["secret"], &secret) != nil || mode == "" || identifier == "" || secret == "" {
		return verifierRequest{}, errors.New("invalid verifier request")
	}
	if rawVersion, ok := object["verifierKeyVersion"]; ok {
		if json.Unmarshal(rawVersion, &verifierKeyVersion) != nil {
			return verifierRequest{}, errors.New("invalid verifier request")
		}
	}
	if mode != "ISSUE" && mode != "VERIFY" {
		return verifierRequest{}, errors.New("invalid verifier request")
	}
	_, hasVerifierKeyVersion := object["verifierKeyVersion"]
	if mode == "ISSUE" && (hasVerifierKeyVersion || len(object) != 3) {
		return verifierRequest{}, errors.New("invalid verifier request")
	}
	if mode == "VERIFY" && (!hasVerifierKeyVersion || verifierKeyVersion == "" || len(object) != 4) {
		return verifierRequest{}, errors.New("invalid verifier request")
	}
	return verifierRequest{Mode: mode, Identifier: identifier, Secret: secret, VerifierKeyVersion: verifierKeyVersion}, nil
}
