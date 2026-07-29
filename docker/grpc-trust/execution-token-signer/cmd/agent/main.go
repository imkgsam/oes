// execution-token-signer-agent starts only after its deployment-bound PKCS#11 manifest and protected provider are validated.
package main

import (
	"encoding/json"
	"errors"
	"os"
	"strconv"
	"time"

	"oes/execution-token-signer-agent/manifest"
)

// main owns the agent lifecycle and never exposes a socket when protected configuration or bootstrap validation fails.
func main() {
	config, err := loadConfig()
	if err != nil {
		panic(err)
	}
	document, err := manifest.Load(config.manifestPath)
	if err != nil {
		panic(err)
	}
	adapter, err := OpenPKCS11(config.modulePath, config.leaseDuration)
	if err != nil {
		panic(err)
	}
	runtime, err := BootstrapRuntime(adapter, document, config.keyRef, config.credential)
	if err != nil {
		_ = adapter.Close()
		panic(err)
	}
	defer runtime.Close()
	if err := ServeUnix(config.socketPath, func(method string, params json.RawMessage) (any, error) {
		return Dispatch(runtime, method, params)
	}); err != nil {
		panic(err)
	}
}

type agentConfig struct {
	socketPath    string
	modulePath    string
	manifestPath  string
	keyRef        string
	leaseDuration time.Duration
	credential    CredentialResolver
}

// loadConfig validates deployment-only bindings without accepting caller-controlled endpoints or selectors.
func loadConfig() (agentConfig, error) {
	socket := os.Getenv("AUTH_EXECUTION_SIGNER_SOCKET_PATH")
	module := os.Getenv("AUTH_EXECUTION_PKCS11_MODULE")
	keyRef := os.Getenv("AUTH_EXECUTION_KMS_KEY_REF")
	manifestPath := os.Getenv("EXECUTION_SIGNER_ROTATION_MANIFEST_PATH")
	if err := validateConfig(socket, module, keyRef, manifestPath); err != nil {
		return agentConfig{}, err
	}
	leaseDuration, err := parseLeaseDuration(os.Getenv("EXECUTION_SIGNER_SESSION_LEASE_SECONDS"))
	if err != nil {
		return agentConfig{}, err
	}
	var credential CredentialResolver
	if path := os.Getenv("EXECUTION_SIGNER_PIN_FILE"); path != "" {
		credential = FileCredentialResolver{path: path}
	}
	return agentConfig{socketPath: socket, modulePath: module, manifestPath: manifestPath, keyRef: keyRef, leaseDuration: leaseDuration, credential: credential}, nil
}

// validateConfig rejects incomplete deployment binding before module, token, or session initialization.
func validateConfig(socket, module, keyRef, manifestPath string) error {
	if socket == "" || module == "" || keyRef == "" || manifestPath == "" {
		return errors.New("protected signer configuration missing")
	}
	return nil
}

// parseLeaseDuration applies a bounded default lease and rejects unreasonably long or non-positive session windows.
func parseLeaseDuration(raw string) (time.Duration, error) {
	if raw == "" {
		return time.Minute, nil
	}
	seconds, err := strconv.Atoi(raw)
	if err != nil || seconds < 1 || seconds > 3600 {
		return 0, errors.New("invalid protected session lease")
	}
	return time.Duration(seconds) * time.Second, nil
}
