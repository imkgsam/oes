package main

import (
	"encoding/json"
	"errors"
	"io"
	"net"
	"os"

	"oes/execution-token-signer-agent/protocol"
)

// ServeUnix exposes the frozen protocol only over the configured pod-local Unix socket.
func ServeUnix(path string, invoke func(string, json.RawMessage) (any, error)) error {
	if path == "" {
		return errors.New("signer socket path required")
	}
	_ = os.Remove(path)
	listener, err := net.Listen("unix", path)
	if err != nil {
		return err
	}
	defer listener.Close()
	for {
		connection, err := listener.Accept()
		if err != nil {
			return err
		}
		go serveConnection(connection, invoke)
	}
}

// ServeProtocol shares the exact JSON-RPC routing path with UDS serving for focused ordinary protocol tests.
func ServeProtocol(reader io.Reader, writer io.Writer, backend Backend) {
	protocol.Serve(reader, writer, func(method string, params json.RawMessage) (any, error) {
		return Dispatch(backend, method, params)
	})
}

// serveConnection applies the exact frozen JSON-RPC protocol to one accepted Unix-socket peer.
func serveConnection(connection net.Conn, invoke func(string, json.RawMessage) (any, error)) {
	defer connection.Close()
	protocol.Serve(connection, connection, invoke)
}
