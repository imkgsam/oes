// Package es256 centralizes the immutable public-JWK, RFC7638, and JOSE verification rules shared by the agent and host harness.
package es256

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"math/big"
)

// PublicJWK is the complete public P-256 JWK needed for kid derivation and ES256 verification.
type PublicJWK struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

// Kid calculates the RFC7638 SHA-256 thumbprint of canonical ES256 public-JWK members.
func Kid(x, y string) string {
	canonical := []byte(`{"crv":"P-256","kty":"EC","x":"` + x + `","y":"` + y + `"}`)
	digest := sha256.Sum256(canonical)
	return base64.RawURLEncoding.EncodeToString(digest[:])
}

// FromDERPoint converts the RFC5912 PKCS#11 EC-point attribute into the frozen ES256 public-JWK representation.
func FromDERPoint(value []byte) (PublicJWK, error) {
	point, err := DecodeDEROctetString(value)
	if err != nil || len(point) != 65 || point[0] != 0x04 {
		return PublicJWK{}, errors.New("P-256 public point is invalid")
	}
	return PublicJWK{Kty: "EC", Crv: "P-256", X: base64.RawURLEncoding.EncodeToString(point[1:33]), Y: base64.RawURLEncoding.EncodeToString(point[33:])}, nil
}

// DecodeDEROctetString unwraps the RFC5912 octet string returned by compliant PKCS#11 providers.
func DecodeDEROctetString(value []byte) ([]byte, error) {
	if len(value) < 2 || value[0] != 0x04 {
		return nil, errors.New("DER octet string required")
	}
	length, offset := int(value[1]), 2
	if length&0x80 != 0 {
		width := length & 0x7f
		if width == 0 || width > 2 || len(value) < offset+width {
			return nil, errors.New("invalid DER length")
		}
		length = 0
		for _, part := range value[offset : offset+width] {
			length = length<<8 | int(part)
		}
		offset += width
	}
	if length != len(value)-offset {
		return nil, errors.New("invalid DER content length")
	}
	return value[offset:], nil
}

// Verify proves one fixed-width JOSE ES256 signature against a canonical P-256 public JWK.
func Verify(publicJWK PublicJWK, input, signature []byte) error {
	if publicJWK.Kty != "EC" || publicJWK.Crv != "P-256" || len(signature) != 64 {
		return errors.New("public signature is invalid")
	}
	x, err := base64.RawURLEncoding.DecodeString(publicJWK.X)
	if err != nil || len(x) != 32 {
		return errors.New("public signature is invalid")
	}
	y, err := base64.RawURLEncoding.DecodeString(publicJWK.Y)
	if err != nil || len(y) != 32 {
		return errors.New("public signature is invalid")
	}
	curve := elliptic.P256()
	publicKey := ecdsa.PublicKey{Curve: curve, X: new(big.Int).SetBytes(x), Y: new(big.Int).SetBytes(y)}
	if !curve.IsOnCurve(publicKey.X, publicKey.Y) {
		return errors.New("public signature is invalid")
	}
	digest := sha256.Sum256(input)
	if !ecdsa.Verify(&publicKey, digest[:], new(big.Int).SetBytes(signature[:32]), new(big.Int).SetBytes(signature[32:])) {
		return errors.New("public/private key mismatch")
	}
	return nil
}
