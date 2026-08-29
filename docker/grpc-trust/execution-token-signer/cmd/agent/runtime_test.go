package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"oes/execution-token-signer-agent/manifest"
	verifiermanifest "oes/execution-token-signer-agent/verifiermanifest"
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

// TestRuntimeSerializesProtectedProviderOperations proves concurrent UDS requests cannot share one PKCS#11 session at the same time.
func TestRuntimeSerializesProtectedProviderOperations(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	var active int32
	var maximum int32
	protectedOperation := func(result []byte) []byte {
		current := atomic.AddInt32(&active, 1)
		for {
			observed := atomic.LoadInt32(&maximum)
			if current <= observed || atomic.CompareAndSwapInt32(&maximum, observed, current) {
				break
			}
		}
		time.Sleep(time.Millisecond)
		atomic.AddInt32(&active, -1)
		return result
	}
	runtime := NewRuntime([]resolvedKey{{
		binding:  Binding{Selector: manifest.Selector{TokenSerial: "serial", ID: []byte{1}}, ExpectedKID: "active"},
		response: KeyResponse{KID: "active", PublicJWK: PublicJWK{Kty: "EC", Crv: "P-256", X: "x", Y: "y"}, PublishNotBeforeUnixSeconds: now.Add(-time.Hour).Unix(), SigningNotBeforeUnixSeconds: now.Add(-time.Minute).Unix(), SigningNotAfterUnixSeconds: now.Add(time.Minute).Unix(), RetireAfterUnixSeconds: now.Add(time.Hour).Unix()},
		sign:     func([]byte) ([]byte, error) { return protectedOperation(bytes.Repeat([]byte{7}, 64)), nil },
	}}, now)
	runtime.AttachVerifierRuntime([]resolvedVerifier{{
		response: ExternalApiKeyVerifierVersionResponse{VerifierKeyVersion: "active-verifier", State: string(verifiermanifest.Active), ActivatedAtUnixSeconds: now.Add(-time.Hour).Unix()},
		compute:  func([]byte) ([]byte, error) { return protectedOperation(bytes.Repeat([]byte{0x33}, 32)), nil },
	}})
	identifier := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x11}, 18))
	secret := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x22}, 32))
	var group sync.WaitGroup
	errors := make(chan error, 16)
	for index := 0; index < 8; index++ {
		group.Add(2)
		go func() {
			defer group.Done()
			_, err := runtime.SignES256("active", []byte("input"))
			errors <- err
		}()
		go func() {
			defer group.Done()
			_, err := runtime.ComputeExternalApiKeyVerifier("ISSUE", identifier, secret, "")
			errors <- err
		}()
	}
	group.Wait()
	close(errors)
	for err := range errors {
		if err != nil {
			t.Fatal(err)
		}
	}
	if maximum != 1 {
		t.Fatalf("protected-provider maximum concurrency = %d, want 1", maximum)
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

// TestVerifierRuntimeEnforcesLifecycle proves provider operations cannot use future active, retired verify-only, or compromised versions.
func TestVerifierRuntimeEnforcesLifecycle(t *testing.T) {
	now := time.Date(2026, 8, 2, 12, 0, 0, 0, time.UTC)
	identifier := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x11}, 18))
	secret := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x22}, 32))

	t.Run("future active version", func(t *testing.T) {
		runtime := NewRuntime(nil, now)
		runtime.AttachVerifierRuntime([]resolvedVerifier{
			resolvedTestVerifier("future", verifiermanifest.Active, now.Add(time.Minute), time.Time{}, time.Time{}),
		})
		if _, err := runtime.ComputeExternalApiKeyVerifier("ISSUE", identifier, secret, ""); err == nil {
			t.Fatal("future active verifier accepted")
		}
	})

	t.Run("retired verify-only version", func(t *testing.T) {
		runtime := NewRuntime(nil, now)
		runtime.AttachVerifierRuntime([]resolvedVerifier{
			resolvedTestVerifier("active", verifiermanifest.Active, now.Add(-time.Hour), time.Time{}, time.Time{}),
			resolvedTestVerifier("retired", verifiermanifest.VerifyOnly, now.Add(-2*time.Hour), now.Add(-time.Hour), now),
		})
		if _, err := runtime.ComputeExternalApiKeyVerifier("VERIFY", identifier, secret, "retired"); err == nil {
			t.Fatal("retired verify-only verifier accepted")
		}
	})

	t.Run("compromised-disabled version", func(t *testing.T) {
		runtime := NewRuntime(nil, now)
		runtime.AttachVerifierRuntime([]resolvedVerifier{
			resolvedTestVerifier("active", verifiermanifest.Active, now.Add(-time.Hour), time.Time{}, time.Time{}),
			resolvedCompromisedVerifier("compromised", "INC-1", "rev-7", now.Add(-2*time.Hour)),
		})
		status, err := runtime.GetExternalApiKeyVerifierStatus()
		if err != nil {
			t.Fatal(err)
		}
		if len(status.Versions) != 2 || status.Versions[1].State != string(verifiermanifest.CompromisedDisabled) || status.Versions[1].IncidentReference != "INC-1" {
			t.Fatalf("unexpected compromised status: %#v", status)
		}
		if _, err := runtime.ComputeExternalApiKeyVerifier("VERIFY", identifier, secret, "compromised"); err == nil {
			t.Fatal("compromised-disabled verifier accepted")
		}
	})
}

func resolvedTestKey(kid string, publish, signing, signingEnd, retire time.Time) resolvedKey {
	return resolvedKey{binding: Binding{Selector: manifest.Selector{TokenSerial: "serial", ID: []byte{1}}, ExpectedKID: kid}, response: KeyResponse{KID: kid, PublicJWK: PublicJWK{Kty: "EC", Crv: "P-256", X: "x", Y: "y"}, PublishNotBeforeUnixSeconds: publish.Unix(), SigningNotBeforeUnixSeconds: signing.Unix(), SigningNotAfterUnixSeconds: signingEnd.Unix(), RetireAfterUnixSeconds: retire.Unix()}, sign: func([]byte) ([]byte, error) { return bytes.Repeat([]byte{7}, 64), nil }}
}

// resolvedTestVerifier creates a deterministic verifier lifecycle with a real fixed-width HMAC-shaped result.
func resolvedTestVerifier(version string, state verifiermanifest.State, activatedAt, verifyOnlyAt, retireAfter time.Time) resolvedVerifier {
	return resolvedVerifier{
		response: ExternalApiKeyVerifierVersionResponse{
			VerifierKeyVersion:      version,
			State:                   string(state),
			ActivatedAtUnixSeconds:  activatedAt.Unix(),
			VerifyOnlyAtUnixSeconds: unixSecondsOrZero(verifyOnlyAt),
			RetireAfterUnixSeconds:  unixSecondsOrZero(retireAfter),
		},
		compute: func([]byte) ([]byte, error) { return bytes.Repeat([]byte{0x33}, 32), nil },
	}
}

// resolvedCompromisedVerifier creates one terminal compromised-disabled status without any callable compute path.
func resolvedCompromisedVerifier(version, incidentReference, stateRevision string, occurredAt time.Time) resolvedVerifier {
	return resolvedVerifier{
		response: ExternalApiKeyVerifierVersionResponse{
			VerifierKeyVersion:    version,
			State:                 string(verifiermanifest.CompromisedDisabled),
			IncidentReference:     incidentReference,
			OccurredAtUnixSeconds: occurredAt.Unix(),
			StateRevision:         stateRevision,
		},
	}
}

// unixSecondsOrZero preserves the wire representation used for absent optional lifecycle boundaries.
func unixSecondsOrZero(value time.Time) int64 {
	if value.IsZero() {
		return 0
	}
	return value.Unix()
}
