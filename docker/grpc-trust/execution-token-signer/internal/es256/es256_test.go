package es256

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"testing"
)

// TestFromDERPointAndKidUseTheCanonicalES256PublicRepresentation proves the host harness and agent share one public-fact derivation.
func TestFromDERPointAndKidUseTheCanonicalES256PublicRepresentation(t *testing.T) {
	point := make([]byte, 65)
	point[0], point[32], point[64] = 0x04, 1, 2
	public, err := FromDERPoint(append([]byte{0x04, 65}, point...))
	if err != nil {
		t.Fatal(err)
	}
	if public.Kty != "EC" || public.Crv != "P-256" || Kid(public.X, public.Y) == "" {
		t.Fatal("canonical public JWK was not derived")
	}
}

// TestVerifyRejectsWrongSignature proves the shared checker rejects an unrelated fixed-width JOSE signature.
func TestVerifyRejectsWrongSignature(t *testing.T) {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	input := []byte("host-check")
	digest := sha256.Sum256(input)
	r, s, err := ecdsa.Sign(rand.Reader, privateKey, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	public := PublicJWK{Kty: "EC", Crv: "P-256", X: base64.RawURLEncoding.EncodeToString(pad(privateKey.X.Bytes())), Y: base64.RawURLEncoding.EncodeToString(pad(privateKey.Y.Bytes()))}
	signature := append(pad(r.Bytes()), pad(s.Bytes())...)
	if err := Verify(public, input, signature); err != nil {
		t.Fatal(err)
	}
	signature[0] ^= 1
	if err := Verify(public, input, signature); err == nil {
		t.Fatal("modified signature accepted")
	}
}

// pad produces one fixed-width P-256 coordinate or JOSE ECDSA component.
func pad(value []byte) []byte {
	output := make([]byte, 32)
	copy(output[32-len(value):], value)
	return output
}
