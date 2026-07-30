// Package main contains the agent-owned PKCS#11 boundary; Auth never receives a private key or raw session handle.
package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
)

// Backend is the closed public-key and ES256 operation set exposed through the signer socket.
type Backend interface {
	GetActiveKey() (KeyResponse, error)
	ListPublishedKeys() ([]KeyResponse, error)
	SignES256(kid string, input []byte) ([]byte, error)
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

// SignResponse returns only a base64url fixed-width JOSE ES256 signature.
type SignResponse struct {
	SignatureBase64URL string `json:"signatureBase64url"`
}

// Dispatch maps the three frozen JSON-RPC methods to the agent-owned backend without selector control.
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
