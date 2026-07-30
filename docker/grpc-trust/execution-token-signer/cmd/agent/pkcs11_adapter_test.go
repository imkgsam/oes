package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"math/big"
	"os"
	"path/filepath"
	"testing"
)

// TestSigningFailsClosedWithoutSession proves the adapter cannot sign without a protected lease.
func TestSigningFailsClosedWithoutSession(t *testing.T) {
	adapter := &PKCS11Adapter{}
	if _, err := adapter.SignSelectedES256([]byte{1}, []byte("x")); err == nil {
		t.Fatal("unavailable session accepted")
	}
}

// TestLookupFailsClosedWithoutSessionOrSelector prevents implicit token and key discovery.
func TestLookupFailsClosedWithoutSessionOrSelector(t *testing.T) {
	adapter := &PKCS11Adapter{}
	if _, err := adapter.FindPrivateKey(nil); err == nil {
		t.Fatal("empty selector accepted")
	}
	if _, err := adapter.FindPrivateKey([]byte{1}); err == nil {
		t.Fatal("unavailable session accepted")
	}
}

// TestLoginFailsClosedWithoutCredentialOrSession prevents an unresolved credential from becoming a no-op.
func TestLoginFailsClosedWithoutCredentialOrSession(t *testing.T) {
	adapter := &PKCS11Adapter{}
	if err := adapter.LoginBytes(nil); err == nil {
		t.Fatal("empty credential accepted")
	}
	if err := adapter.LoginBytes([]byte("opaque")); err == nil {
		t.Fatal("unavailable session accepted")
	}
}

// TestES256KidIsCanonical verifies the RFC7638 thumbprint is base64url encoded.
func TestES256KidIsCanonical(t *testing.T) {
	if ES256Kid("x", "y") == "" {
		t.Fatal("kid missing")
	}
	if _, err := base64.RawURLEncoding.DecodeString(ES256Kid("x", "y")); err != nil {
		t.Fatal(err)
	}
}

// TestDERPointDecodingRejectsMalformedProviderAttributes prevents malformed EC point values entering JWKS.
func TestDERPointDecodingRejectsMalformedProviderAttributes(t *testing.T) {
	if _, err := decodeDEROctetString([]byte{0x04, 0x02, 0x01}); err == nil {
		t.Fatal("malformed DER accepted")
	}
}

// TestPublicSignatureVerificationRejectsMismatchedPairs proves a same-ID but unrelated public object cannot pass bootstrap.
func TestPublicSignatureVerificationRejectsMismatchedPairs(t *testing.T) {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	input := []byte("bootstrap")
	digest := sha256.Sum256(input)
	r, s, err := ecdsa.Sign(rand.Reader, privateKey, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	signature := append(leftPad(r.Bytes(), 32), leftPad(s.Bytes(), 32)...)
	publicJWK := PublicJWK{Kty: "EC", Crv: "P-256", X: base64.RawURLEncoding.EncodeToString(leftPad(privateKey.X.Bytes(), 32)), Y: base64.RawURLEncoding.EncodeToString(leftPad(privateKey.Y.Bytes(), 32))}
	if err := verifyPublicSignature(publicJWK, input, signature); err != nil {
		t.Fatal(err)
	}
	publicJWK.X = base64.RawURLEncoding.EncodeToString(leftPad(big.NewInt(1).Bytes(), 32))
	if err := verifyPublicSignature(publicJWK, input, signature); err == nil {
		t.Fatal("mismatched key pair accepted")
	}
}

// TestFileCredentialResolverRejectsWeakFilePermissions keeps optional backend credentials inside agent-only mounts.
func TestFileCredentialResolverRejectsWeakFilePermissions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pin")
	if err := os.WriteFile(path, []byte("secret\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := (FileCredentialResolver{path: path}).Resolve(); err == nil {
		t.Fatal("world-readable credential accepted")
	}
	if err := os.Chmod(path, 0o600); err != nil {
		t.Fatal(err)
	}
	credential, err := (FileCredentialResolver{path: path}).Resolve()
	if err != nil || string(credential) != "secret" {
		t.Fatalf("credential resolution failed: %q, %v", credential, err)
	}
	zero(credential)
	if string(credential) != "\x00\x00\x00\x00\x00\x00" {
		t.Fatal("credential buffer was not zeroized")
	}
}

// leftPad produces the fixed-width coordinate and ECDSA component form required by P-256 JOSE values.
func leftPad(value []byte, width int) []byte {
	output := make([]byte, width)
	copy(output[width-len(value):], value)
	return output
}
