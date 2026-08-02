// Package protocol defines the closed signer-agent JSON-RPC method allowlist.
package protocol

const GetActiveKey = "GetActiveKey"
const ListPublishedKeys = "ListPublishedKeys"
const SignEs256 = "SignEs256"
const GetExternalApiKeyVerifierStatus = "GetExternalApiKeyVerifierStatus"
const ComputeExternalApiKeyVerifier = "ComputeExternalApiKeyVerifier"

// Allowed reports whether a request belongs to the frozen signer or external API-key verifier provider contract.
func Allowed(method string) bool {
	return method == GetActiveKey ||
		method == ListPublishedKeys ||
		method == SignEs256 ||
		method == GetExternalApiKeyVerifierStatus ||
		method == ComputeExternalApiKeyVerifier
}
