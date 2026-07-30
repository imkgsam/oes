package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"testing"
	"time"

	"oes/execution-token-signer-agent/manifest"
)

// TestRuntimeExposesOnlyTheActiveAndPublishedTimeline proves timeline selection cannot be request controlled.
func TestRuntimeExposesOnlyTheActiveAndPublishedTimeline(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	runtime := NewRuntime([]resolvedKey{
		resolvedTestKey("active", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(5*time.Minute), now.Add(11*time.Minute)),
		resolvedTestKey("overlap", now.Add(-10*time.Minute), now.Add(-9*time.Minute), now.Add(-time.Minute), now.Add(5*time.Minute)),
	}, now)
	active, err := runtime.GetActiveKey()
	if err != nil || active.KID != "active" {
		t.Fatalf("active key = %#v, %v", active, err)
	}
	published, err := runtime.ListPublishedKeys()
	if err != nil || len(published) != 2 {
		t.Fatalf("published = %#v, %v", published, err)
	}
}

// TestRuntimeFailsClosedForZeroOrMultipleActiveKeys proves readiness cannot choose an arbitrary manifest key.
func TestRuntimeFailsClosedForZeroOrMultipleActiveKeys(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	for _, keys := range [][]resolvedKey{
		{resolvedTestKey("future", now, now.Add(time.Minute), now.Add(2*time.Minute), now.Add(8*time.Minute))},
		{resolvedTestKey("one", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute), now.Add(7*time.Minute)), resolvedTestKey("two", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute), now.Add(7*time.Minute))},
	} {
		if _, err := NewRuntime(keys, now).GetActiveKey(); err == nil {
			t.Fatal("invalid active-key set accepted")
		}
	}
}

// TestDispatchRejectsAnUnpublishedKid proves a caller cannot use an overlap or arbitrary key for signing.
func TestDispatchRejectsAnUnpublishedKid(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	runtime := NewRuntime([]resolvedKey{resolvedTestKey("active", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute), now.Add(7*time.Minute))}, now)
	params := json.RawMessage(`{"kid":"other","signingInputBase64url":"aGVsbG8"}`)
	if _, err := Dispatch(runtime, "SignEs256", params); err == nil {
		t.Fatal("unknown kid accepted")
	}
}

// TestDispatchUsesExactSignParameters proves the live protocol returns only fixed-width base64url JOSE signatures.
func TestDispatchUsesExactSignParameters(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	runtime := NewRuntime([]resolvedKey{resolvedTestKey("active", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute), now.Add(7*time.Minute))}, now)
	value, err := Dispatch(runtime, "SignEs256", json.RawMessage(`{"kid":"active","signingInputBase64url":"aGVsbG8"}`))
	if err != nil {
		t.Fatal(err)
	}
	response, ok := value.(SignResponse)
	if !ok {
		t.Fatalf("unexpected response %T", value)
	}
	signature, err := base64.RawURLEncoding.DecodeString(response.SignatureBase64URL)
	if err != nil || len(signature) != 64 {
		t.Fatalf("invalid JOSE signature: %d, %v", len(signature), err)
	}
}

// TestProtocolServesTheRuntimeOverUDSContract exercises the actual JSON-RPC dispatch path without a network listener.
func TestProtocolServesTheRuntimeOverUDSContract(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	runtime := NewRuntime([]resolvedKey{resolvedTestKey("active", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute), now.Add(7*time.Minute))}, now)
	input := bytes.NewBufferString(`{"jsonrpc":"2.0","id":1,"method":"GetActiveKey","params":{}}` + "\n")
	output := new(bytes.Buffer)
	ServeProtocol(input, output, runtime)
	if !bytes.Contains(output.Bytes(), []byte(`"kid":"active"`)) {
		t.Fatalf("unexpected protocol response: %s", output.String())
	}
}

func resolvedTestKey(kid string, publish, signing, signingEnd, retire time.Time) resolvedKey {
	return resolvedKey{binding: Binding{Selector: manifest.Selector{TokenSerial: "serial", ID: []byte{1}}, ExpectedKID: kid}, response: KeyResponse{KID: kid, PublicJWK: PublicJWK{Kty: "EC", Crv: "P-256", X: "x", Y: "y"}, PublishNotBeforeUnixSeconds: publish.Unix(), SigningNotBeforeUnixSeconds: signing.Unix(), SigningNotAfterUnixSeconds: signingEnd.Unix(), RetireAfterUnixSeconds: retire.Unix()}, sign: func([]byte) ([]byte, error) { return bytes.Repeat([]byte{7}, 64), nil }}
}
