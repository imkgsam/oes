// Package protocol defines the closed signer-agent JSON-RPC method allowlist.
package protocol

const GetActiveKey = "GetActiveKey"
const ListPublishedKeys = "ListPublishedKeys"
const SignEs256 = "SignEs256"

// Allowed reports whether a request belongs to the frozen three-method provider contract.
func Allowed(method string) bool { return method == GetActiveKey || method == ListPublishedKeys || method == SignEs256 }
