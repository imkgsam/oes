package protocol

import "testing"

func TestAllowed(t *testing.T) {
	if !Allowed(GetActiveKey) || !Allowed(ListPublishedKeys) || !Allowed(SignEs256) || !Allowed(GetExternalApiKeyVerifierStatus) || !Allowed(ComputeExternalApiKeyVerifier) || Allowed("ExportPrivateKey") {
		t.Fatal("protocol allowlist violation")
	}
}
