// execution-token-signer-agent starts only after the deployment-bound PKCS#11 provider is initialized.
package main

import("errors";"os")

// main owns module lifetime and intentionally exits before serving any UDS request when protected configuration is absent.
func main() {
	module := os.Getenv("AUTH_EXECUTION_PKCS11_MODULE")
	if err:=validateConfig(os.Getenv("AUTH_EXECUTION_SIGNER_SOCKET_PATH"),module,os.Getenv("AUTH_EXECUTION_KMS_KEY_REF"));err!=nil{panic(err)}
	adapter, err := OpenPKCS11(module)
	if err != nil { panic(err) }
	defer adapter.Close()
	select {}
}
// validateConfig rejects incomplete deployment binding before module/session initialization.
func validateConfig(socket,module,keyRef string)error{if socket==""||module==""||keyRef==""{return errors.New("protected signer configuration missing")};return nil}
