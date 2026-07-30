package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"testing"
	"time"
)

// TestServeUnixRejectsEmptyPath forbids an implicit socket endpoint.
func TestServeUnixRejectsEmptyPath(t *testing.T) {
	if err := ServeUnix("", func(string, json.RawMessage) (any, error) { return nil, nil }); err == nil {
		t.Fatal("socket path required")
	}
}

// TestUDSServesActivePublishedAndSigningCalls exercises all frozen methods through a real Unix-domain socket.
func TestUDSServesActivePublishedAndSigningCalls(t *testing.T) {
	path := fmt.Sprintf("/tmp/oes-signer-%d.sock", time.Now().UnixNano())
	defer os.Remove(path)
	listener, err := net.Listen("unix", path)
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	runtime := NewRuntime([]resolvedKey{resolvedTestKey("active", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute), now.Add(7*time.Minute))}, now)
	for range 3 {
		go func() {
			connection, err := listener.Accept()
			if err == nil {
				serveConnection(connection, func(method string, params json.RawMessage) (any, error) { return Dispatch(runtime, method, params) })
			}
		}()
	}
	for _, request := range []string{
		`{"jsonrpc":"2.0","id":1,"method":"GetActiveKey","params":{}}`,
		`{"jsonrpc":"2.0","id":2,"method":"ListPublishedKeys","params":{}}`,
		`{"jsonrpc":"2.0","id":3,"method":"SignEs256","params":{"kid":"active","signingInputBase64url":"aGVsbG8"}}`,
	} {
		response := invokeUDS(t, path, request)
		if response["error"] != nil || response["result"] == nil {
			t.Fatalf("unexpected UDS response: %#v", response)
		}
	}
}

// invokeUDS sends one newline-delimited request to the real local socket and decodes the corresponding JSON-RPC response.
func invokeUDS(t *testing.T, path, request string) map[string]any {
	t.Helper()
	connection, err := net.Dial("unix", path)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	if _, err := connection.Write([]byte(request + "\n")); err != nil {
		t.Fatal(err)
	}
	line, err := bufio.NewReader(connection).ReadBytes('\n')
	if err != nil {
		t.Fatal(err)
	}
	var response map[string]any
	if err := json.Unmarshal(line, &response); err != nil {
		t.Fatal(err)
	}
	return response
}
