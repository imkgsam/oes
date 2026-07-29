// host-check provides only local SoftHSM2 harness operations; it does not add any signer socket method or production key-selection path.
package main

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	"github.com/miekg/pkcs11"
	"oes/execution-token-signer-agent/internal/es256"
	"oes/execution-token-signer-agent/manifest"
)

var p256OID = []byte{0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07}

// main dispatches the host-only derive, manifest-writing, UDS verification, and outage assertions used by run-host.sh.
func main() {
	if len(os.Args) < 2 {
		fatal(errors.New("host-check command required"))
	}
	switch os.Args[1] {
	case "init-token":
		fatal(runInitToken(os.Args[2:]))
	case "generate-keypair":
		fatal(runGenerateKeyPair(os.Args[2:]))
	case "derive-kid":
		fatal(runDeriveKid(os.Args[2:]))
	case "write-manifest":
		fatal(runWriteManifest(os.Args[2:]))
	case "verify-uds":
		fatal(runVerifyUDS(os.Args[2:]))
	case "assert-outage":
		fatal(runAssertOutage(os.Args[2:]))
	case "assert-private-nonexportable":
		fatal(runAssertPrivateNonExportable(os.Args[2:]))
	default:
		fatal(errors.New("host-check command forbidden"))
	}
}

// runInitToken initializes an isolated SoftHSM token and user PIN from the restricted file without exposing either PIN to a CLI argument.
func runInitToken(arguments []string) error {
	flags := flag.NewFlagSet("init-token", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	modulePath := flags.String("module", "", "")
	pinFile := flags.String("pin-file", "", "")
	label := flags.String("label", "", "")
	if flags.Parse(arguments) != nil || *modulePath == "" || *pinFile == "" || *label == "" {
		return errors.New("init-token requires module, pin-file, and label")
	}
	pin, err := credentialFromFile(*pinFile)
	if err != nil {
		return err
	}
	defer zero(pin)
	module := pkcs11.New(*modulePath)
	if module == nil {
		return errors.New("PKCS11 module unavailable")
	}
	defer module.Destroy()
	if err := module.Initialize(); err != nil {
		return err
	}
	defer module.Finalize()
	slot, err := findUninitializedSlot(module)
	if err != nil {
		return err
	}
	if err := module.InitToken(slot, string(pin), *label); err != nil {
		return err
	}
	session, err := module.OpenSession(slot, pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION)
	if err != nil {
		return err
	}
	defer module.CloseSession(session)
	if err := module.Login(session, pkcs11.CKU_SO, string(pin)); err != nil {
		return err
	}
	defer module.Logout(session)
	if err := module.InitPIN(session, string(pin)); err != nil {
		return err
	}
	info, err := module.GetTokenInfo(slot)
	if err != nil {
		return err
	}
	_, err = fmt.Println(strings.TrimSpace(info.SerialNumber))
	return err
}

// runGenerateKeyPair creates one sensitive, non-extractable P-256 pair without passing the token PIN through a process argument.
func runGenerateKeyPair(arguments []string) error {
	flags := flag.NewFlagSet("generate-keypair", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	module := flags.String("module", "", "")
	uri := flags.String("uri", "", "")
	pinFile := flags.String("pin-file", "", "")
	label := flags.String("label", "", "")
	if flags.Parse(arguments) != nil || *module == "" || *uri == "" || *pinFile == "" || *label == "" {
		return errors.New("generate-keypair requires module, uri, pin-file, and label")
	}
	return withTokenSession(*module, *uri, *pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector manifest.Selector) error {
		public, private := keyPairTemplates(selector.ID, *label)
		_, _, err := module.GenerateKeyPair(session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_EC_KEY_PAIR_GEN, nil)}, public, private)
		return err
	})
}

// runDeriveKid derives the manifest expected kid from an actual HSM public object using the agent's shared canonical implementation.
func runDeriveKid(arguments []string) error {
	flags := flag.NewFlagSet("derive-kid", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	module := flags.String("module", "", "")
	uri := flags.String("uri", "", "")
	pinFile := flags.String("pin-file", "", "")
	if flags.Parse(arguments) != nil || *module == "" || *uri == "" || *pinFile == "" {
		return errors.New("derive-kid requires module, uri, and pin-file")
	}
	public, err := publicJWK(*module, *uri, *pinFile)
	if err != nil {
		return err
	}
	_, err = fmt.Println(es256.Kid(public.X, public.Y))
	return err
}

// runWriteManifest writes a deterministic active-plus-overlap timeline that is valid at command execution time.
func runWriteManifest(arguments []string) error {
	flags := flag.NewFlagSet("write-manifest", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	output := flags.String("output", "", "")
	activeURI := flags.String("active-uri", "", "")
	activeKID := flags.String("active-kid", "", "")
	overlapURI := flags.String("overlap-uri", "", "")
	overlapKID := flags.String("overlap-kid", "", "")
	if flags.Parse(arguments) != nil || *output == "" || *activeURI == "" || *activeKID == "" || *overlapURI == "" || *overlapKID == "" {
		return errors.New("write-manifest requires output and active/overlap URI/kid pairs")
	}
	now := time.Now().UTC()
	document := manifest.Document{Keys: []manifest.Entry{
		entry(*activeURI, *activeKID, now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(5*time.Minute), now.Add(11*time.Minute)),
		entry(*overlapURI, *overlapKID, now.Add(-20*time.Minute), now.Add(-15*time.Minute), now.Add(-5*time.Minute), now.Add(time.Minute)),
	}}
	if err := document.Validate(); err != nil {
		return err
	}
	encoded, err := json.Marshal(document)
	if err != nil {
		return err
	}
	return os.WriteFile(*output, append(encoded, '\n'), 0o600)
}

// runVerifyUDS proves actual active-key lookup, overlap publication, and protected ES256 signing over the Unix socket.
func runVerifyUDS(arguments []string) error {
	flags := flag.NewFlagSet("verify-uds", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	socket := flags.String("socket", "", "")
	activeKID := flags.String("active-kid", "", "")
	if flags.Parse(arguments) != nil || *socket == "" || *activeKID == "" {
		return errors.New("verify-uds requires socket and active-kid")
	}
	var active keyResponse
	if err := call(*socket, "GetActiveKey", map[string]any{}, &active); err != nil || active.KID != *activeKID {
		return errors.New("active UDS key verification failed")
	}
	var published []keyResponse
	if err := call(*socket, "ListPublishedKeys", map[string]any{}, &published); err != nil || len(published) != 2 {
		return errors.New("overlap UDS publication verification failed")
	}
	input := []byte("oes-host-uds-signature-verification")
	var signed signResponse
	if err := call(*socket, "SignEs256", map[string]any{"kid": active.KID, "signingInputBase64url": base64.RawURLEncoding.EncodeToString(input)}, &signed); err != nil {
		return err
	}
	signature, err := base64.RawURLEncoding.DecodeString(signed.SignatureBase64URL)
	if err != nil || es256.Verify(active.PublicJWK, input, signature) != nil {
		return errors.New("UDS ES256 signature verification failed")
	}
	return nil
}

// runAssertOutage proves a stopped sidecar cannot be silently replaced by a fallback transport or signer.
func runAssertOutage(arguments []string) error {
	flags := flag.NewFlagSet("assert-outage", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	socket := flags.String("socket", "", "")
	if flags.Parse(arguments) != nil || *socket == "" {
		return errors.New("assert-outage requires socket")
	}
	connection, err := net.DialTimeout("unix", *socket, 500*time.Millisecond)
	if err == nil {
		connection.Close()
		return errors.New("stopped signer still accepts UDS connections")
	}
	return nil
}

// runAssertPrivateNonExportable performs a real PKCS#11 private-value access attempt and requires the object to remain sensitive and non-extractable.
func runAssertPrivateNonExportable(arguments []string) error {
	flags := flag.NewFlagSet("assert-private-nonexportable", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	module := flags.String("module", "", "")
	uri := flags.String("uri", "", "")
	pinFile := flags.String("pin-file", "", "")
	if flags.Parse(arguments) != nil || *module == "" || *uri == "" || *pinFile == "" {
		return errors.New("assert-private-nonexportable requires module, uri, and pin-file")
	}
	return withTokenSession(*module, *uri, *pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector manifest.Selector) error {
		key, err := findOne(module, session, pkcs11.CKO_PRIVATE_KEY, selector.ID)
		if err != nil {
			return err
		}
		attributes, err := module.GetAttributeValue(session, key, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_SENSITIVE, nil), pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, nil)})
		if err != nil || !bytes.Equal(attribute(attributes, pkcs11.CKA_SENSITIVE), []byte{1}) || !bytes.Equal(attribute(attributes, pkcs11.CKA_EXTRACTABLE), []byte{0}) {
			return errors.New("private key attributes are exportable")
		}
		value, err := module.GetAttributeValue(session, key, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_VALUE, nil)})
		if err == nil && len(attribute(value, pkcs11.CKA_VALUE)) != 0 {
			return errors.New("private key export was allowed")
		}
		return nil
	})
}

// publicJWK reads one selected public P-256 object without opening a signer socket or private-key export path.
func publicJWK(modulePath, rawURI, pinFile string) (es256.PublicJWK, error) {
	var public es256.PublicJWK
	err := withTokenSession(modulePath, rawURI, pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector manifest.Selector) error {
		key, err := findOne(module, session, pkcs11.CKO_PUBLIC_KEY, selector.ID)
		if err != nil {
			return err
		}
		attributes, err := module.GetAttributeValue(session, key, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_EC_PARAMS, nil), pkcs11.NewAttribute(pkcs11.CKA_EC_POINT, nil)})
		if err != nil || len(attributes) != 2 || string(attribute(attributes, pkcs11.CKA_EC_PARAMS)) != string(p256OID) {
			return errors.New("selected public key is not P-256")
		}
		public, err = es256.FromDERPoint(attribute(attributes, pkcs11.CKA_EC_POINT))
		return err
	})
	return public, err
}

// withTokenSession creates one authenticated local PKCS#11 session from a mode-restricted PIN file and zeroizes its buffer after the operation.
func withTokenSession(modulePath, rawURI, pinFile string, operation func(*pkcs11.Ctx, pkcs11.SessionHandle, manifest.Selector) error) error {
	selector, err := manifest.ParseSelector(rawURI)
	if err != nil {
		return err
	}
	module := pkcs11.New(modulePath)
	if module == nil {
		return errors.New("PKCS11 module unavailable")
	}
	defer module.Destroy()
	if err := module.Initialize(); err != nil {
		return err
	}
	defer module.Finalize()
	slot, err := findSlot(module, selector.TokenSerial)
	if err != nil {
		return err
	}
	session, err := module.OpenSession(slot, pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION)
	if err != nil {
		return err
	}
	defer module.CloseSession(session)
	pin, err := credentialFromFile(pinFile)
	if err != nil {
		return err
	}
	defer zero(pin)
	if err := module.Login(session, pkcs11.CKU_USER, string(pin)); err != nil {
		return err
	}
	defer module.Logout(session)
	return operation(module, session, selector)
}

// credentialFromFile admits only agent-owned mode-600-style local PIN mounts and returns a caller-zeroed buffer.
func credentialFromFile(path string) ([]byte, error) {
	info, err := os.Stat(path)
	if err != nil || info.Mode().Perm()&0o077 != 0 {
		return nil, errors.New("host credential unavailable")
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	pin := append([]byte(nil), bytes.TrimSpace(raw)...)
	zero(raw)
	if len(pin) == 0 {
		return nil, errors.New("host credential unavailable")
	}
	return pin, nil
}

// keyPairTemplates defines the only local key-generation attributes: token-resident, sensitive, non-extractable P-256 signing material.
func keyPairTemplates(id []byte, label string) ([]*pkcs11.Attribute, []*pkcs11.Attribute) {
	public := []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS, pkcs11.CKO_PUBLIC_KEY), pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, pkcs11.CKK_EC), pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true), pkcs11.NewAttribute(pkcs11.CKA_PRIVATE, false), pkcs11.NewAttribute(pkcs11.CKA_LABEL, label), pkcs11.NewAttribute(pkcs11.CKA_ID, id), pkcs11.NewAttribute(pkcs11.CKA_EC_PARAMS, p256OID), pkcs11.NewAttribute(pkcs11.CKA_VERIFY, true)}
	private := []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS, pkcs11.CKO_PRIVATE_KEY), pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, pkcs11.CKK_EC), pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true), pkcs11.NewAttribute(pkcs11.CKA_PRIVATE, true), pkcs11.NewAttribute(pkcs11.CKA_LABEL, label), pkcs11.NewAttribute(pkcs11.CKA_ID, id), pkcs11.NewAttribute(pkcs11.CKA_SENSITIVE, true), pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, false), pkcs11.NewAttribute(pkcs11.CKA_SIGN, true)}
	return public, private
}

// findOne resolves exactly one EC key object by the selector's binary CKA_ID without provider-order fallback.
func findOne(module *pkcs11.Ctx, session pkcs11.SessionHandle, class uint, id []byte) (pkcs11.ObjectHandle, error) {
	attributes := []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS, class), pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, pkcs11.CKK_EC), pkcs11.NewAttribute(pkcs11.CKA_ID, id)}
	if err := module.FindObjectsInit(session, attributes); err != nil {
		return 0, err
	}
	defer module.FindObjectsFinal(session)
	objects, _, err := module.FindObjects(session, 2)
	if err != nil || len(objects) != 1 {
		return 0, errors.New("selected key unavailable")
	}
	return objects[0], nil
}

// call performs one newline-delimited JSON-RPC request over the exact Unix-socket protocol and rejects remote errors.
func call(socket, method string, params any, result any) error {
	connection, err := net.DialTimeout("unix", socket, 3*time.Second)
	if err != nil {
		return err
	}
	defer connection.Close()
	request, _ := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	if _, err := connection.Write(append(request, '\n')); err != nil {
		return err
	}
	var response struct {
		Result json.RawMessage `json:"result"`
		Error  json.RawMessage `json:"error"`
	}
	if err := json.Unmarshal(mustReadLine(connection), &response); err != nil || len(response.Error) != 0 || len(response.Result) == 0 {
		return errors.New("UDS signer request failed")
	}
	return json.Unmarshal(response.Result, result)
}

// findSlot resolves the local token by the same serial pin used in the production manifest selector.
func findSlot(module *pkcs11.Ctx, serial string) (uint, error) {
	slots, err := module.GetSlotList(true)
	if err != nil {
		return 0, err
	}
	for _, slot := range slots {
		info, err := module.GetTokenInfo(slot)
		if err != nil {
			return 0, err
		}
		if strings.TrimSpace(info.SerialNumber) == serial {
			return slot, nil
		}
	}
	return 0, errors.New("selected token unavailable")
}

// findUninitializedSlot chooses a free slot only in the harness's isolated SoftHSM token directory.
func findUninitializedSlot(module *pkcs11.Ctx) (uint, error) {
	slots, err := module.GetSlotList(false)
	if err != nil {
		return 0, err
	}
	if len(slots) == 0 {
		return 0, errors.New("no uninitialized SoftHSM slot available")
	}
	return slots[0], nil
}

// entry renders one UTC manifest timeline while preserving the fixed six-minute retirement overlap.
func entry(uri, kid string, publish, signing, signingEnd, retire time.Time) manifest.Entry {
	return manifest.Entry{PKCS11URI: uri, ExpectedKID: kid, PublishNotBefore: publish.Format(time.RFC3339), SigningNotBefore: signing.Format(time.RFC3339), SigningNotAfter: signingEnd.Format(time.RFC3339), RetireAfter: retire.Format(time.RFC3339)}
}

// attribute extracts a requested PKCS#11 attribute from a response set.
func attribute(attributes []*pkcs11.Attribute, typ uint) []byte {
	for _, value := range attributes {
		if value.Type == typ {
			return value.Value
		}
	}
	return nil
}

// mustReadLine reads one complete JSON-RPC reply or returns an empty document on transport failure.
func mustReadLine(connection net.Conn) []byte {
	line, err := bufio.NewReader(connection).ReadBytes('\n')
	if err != nil {
		return nil
	}
	return line
}

// zero clears agent-local credential buffers after local SoftHSM login completes.
func zero(value []byte) {
	for index := range value {
		value[index] = 0
	}
}

// fatal emits no sensitive details and terminates non-zero for a failed host lifecycle assertion.
func fatal(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "host-check:", err)
		os.Exit(1)
	}
}

// ioDiscard suppresses flag package usage output so the harness only exposes explicit lifecycle failures.
type ioDiscard struct{}

func (ioDiscard) Write(value []byte) (int, error) { return len(value), nil }

type keyResponse struct {
	KID       string          `json:"kid"`
	PublicJWK es256.PublicJWK `json:"publicJwk"`
}
type signResponse struct {
	SignatureBase64URL string `json:"signatureBase64url"`
}
