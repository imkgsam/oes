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
	verifiermanifest "oes/execution-token-signer-agent/verifiermanifest"
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
	case "generate-secret-key":
		fatal(runGenerateSecretKey(os.Args[2:]))
	case "derive-verifier-version":
		fatal(runDeriveVerifierVersion(os.Args[2:]))
	case "write-verifier-manifest":
		fatal(runWriteVerifierManifest(os.Args[2:]))
	case "verify-verifier-uds":
		fatal(runVerifyVerifierUDS(os.Args[2:]))
	case "assert-secret-nonexportable":
		fatal(runAssertSecretNonExportable(os.Args[2:]))
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
		key, err := findOne(module, session, pkcs11.CKO_PRIVATE_KEY, pkcs11.CKK_EC, selector.ID)
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

// runGenerateSecretKey creates one sensitive, non-extractable generic-secret object for the protected verifier path.
func runGenerateSecretKey(arguments []string) error {
	flags := flag.NewFlagSet("generate-secret-key", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	module := flags.String("module", "", "")
	uri := flags.String("uri", "", "")
	pinFile := flags.String("pin-file", "", "")
	label := flags.String("label", "", "")
	if flags.Parse(arguments) != nil || *module == "" || *uri == "" || *pinFile == "" || *label == "" {
		return errors.New("generate-secret-key requires module, uri, pin-file, and label")
	}
	return withVerifierTokenSession(*module, *uri, *pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector verifiermanifest.Selector) error {
		_, err := module.GenerateKey(session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_GENERIC_SECRET_KEY_GEN, nil)}, secretKeyTemplate(selector.ID, *label))
		return err
	})
}

// runDeriveVerifierVersion reports the manifest logical version for a selected HMAC key without exposing the key material.
func runDeriveVerifierVersion(arguments []string) error {
	flags := flag.NewFlagSet("derive-verifier-version", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	version := flags.String("version", "", "")
	if flags.Parse(arguments) != nil || *version == "" {
		return errors.New("derive-verifier-version requires version")
	}
	_, err := fmt.Println(*version)
	return err
}

// runWriteVerifierManifest writes active, verify-only, and optional compromised verifier status timelines that are valid at command execution time.
func runWriteVerifierManifest(arguments []string) error {
	flags := flag.NewFlagSet("write-verifier-manifest", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	output := flags.String("output", "", "")
	activeURI := flags.String("active-uri", "", "")
	activeVersion := flags.String("active-version", "", "")
	verifyOnlyURI := flags.String("verify-only-uri", "", "")
	verifyOnlyVersion := flags.String("verify-only-version", "", "")
	compromisedURI := flags.String("compromised-uri", "", "")
	compromisedVersion := flags.String("compromised-version", "", "")
	compromisedIncident := flags.String("compromised-incident", "", "")
	compromisedStateRevision := flags.String("compromised-state-revision", "", "")
	if flags.Parse(arguments) != nil || *output == "" || *activeURI == "" || *activeVersion == "" || *verifyOnlyURI == "" || *verifyOnlyVersion == "" {
		return errors.New("write-verifier-manifest requires output and active/verify-only URI/version pairs")
	}
	if (*compromisedURI == "") != (*compromisedVersion == "") || (*compromisedURI == "") != (*compromisedIncident == "") || (*compromisedURI == "") != (*compromisedStateRevision == "") {
		return errors.New("compromised verifier manifest arguments must be supplied together")
	}
	now := time.Now().UTC()
	versions := []verifiermanifest.Entry{
		verifierEntry(*activeURI, *activeVersion, verifiermanifest.Active, now.Add(-10*time.Minute)),
		verifierEntryWithVerifyOnly(*verifyOnlyURI, *verifyOnlyVersion, now.Add(-20*time.Minute), now.Add(-15*time.Minute), now.Add(5*time.Minute)),
	}
	if *compromisedURI != "" {
		versions = append(versions, verifierCompromisedEntry(*compromisedURI, *compromisedVersion, *compromisedIncident, *compromisedStateRevision, now.Add(-25*time.Minute)))
	}
	document := verifiermanifest.Document{Versions: versions}
	if err := document.Validate(); err != nil {
		return err
	}
	encoded, err := json.Marshal(document)
	if err != nil {
		return err
	}
	return os.WriteFile(*output, append(encoded, '\n'), 0o600)
}

// runVerifyVerifierUDS proves actual readiness, ISSUE verification, VERIFY-only verification, optional compromised denial, and canonical HMAC output over the Unix socket.
func runVerifyVerifierUDS(arguments []string) error {
	flags := flag.NewFlagSet("verify-verifier-uds", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	socket := flags.String("socket", "", "")
	module := flags.String("module", "", "")
	uri := flags.String("uri", "", "")
	pinFile := flags.String("pin-file", "", "")
	activeVersion := flags.String("active-version", "", "")
	verifyOnlyVersion := flags.String("verify-only-version", "", "")
	compromisedVersion := flags.String("compromised-version", "", "")
	compromisedIncident := flags.String("compromised-incident", "", "")
	compromisedStateRevision := flags.String("compromised-state-revision", "", "")
	if flags.Parse(arguments) != nil || *socket == "" || *module == "" || *uri == "" || *pinFile == "" || *activeVersion == "" || *verifyOnlyVersion == "" {
		return errors.New("verify-verifier-uds requires socket, module, uri, pin-file, active-version, and verify-only-version")
	}
	if (*compromisedVersion == "") != (*compromisedIncident == "") || (*compromisedVersion == "") != (*compromisedStateRevision == "") {
		return errors.New("compromised verifier UDS assertions must be supplied together")
	}
	var status verifierStatusResponse
	if err := call(*socket, "GetExternalApiKeyVerifierStatus", map[string]any{}, &status); err != nil || status.ActiveVerifierKeyVersion != *activeVersion {
		return errors.New("verifier status verification failed")
	}
	identifier := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x11}, 18))
	secret := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x22}, 32))
	var issued verifierResponse
	if err := call(*socket, "ComputeExternalApiKeyVerifier", map[string]any{"mode": "ISSUE", "identifier": identifier, "secret": secret}, &issued); err != nil || issued.VerifierKeyVersion != *activeVersion {
		return errors.New("issue verifier verification failed")
	}
	var verified verifierResponse
	if err := call(*socket, "ComputeExternalApiKeyVerifier", map[string]any{"mode": "VERIFY", "identifier": identifier, "secret": secret, "verifierKeyVersion": *verifyOnlyVersion}, &verified); err != nil || verified.VerifierKeyVersion != *verifyOnlyVersion {
		return errors.New("verify-only verifier verification failed")
	}
	expected, err := computeExpectedVerifier(*module, *uri, *pinFile, identifier, secret)
	if err != nil || verified.Verifier != expected {
		return errors.New("canonical verifier output mismatch")
	}
	if *compromisedVersion != "" {
		compromised, ok := findVerifierStatusVersion(status.Versions, *compromisedVersion)
		if !ok || compromised.State != string(verifiermanifest.CompromisedDisabled) || compromised.IncidentReference != *compromisedIncident || compromised.StateRevision != *compromisedStateRevision || compromised.OccurredAtUnixSeconds <= 0 {
			return errors.New("compromised verifier status verification failed")
		}
		var denied verifierResponse
		if err := call(*socket, "ComputeExternalApiKeyVerifier", map[string]any{"mode": "VERIFY", "identifier": identifier, "secret": secret, "verifierKeyVersion": *compromisedVersion}, &denied); err == nil {
			return errors.New("compromised verifier compute denial failed")
		}
	}
	return nil
}

// runAssertSecretNonExportable performs a real PKCS#11 secret-value access attempt and requires the object to remain sensitive and non-extractable.
func runAssertSecretNonExportable(arguments []string) error {
	flags := flag.NewFlagSet("assert-secret-nonexportable", flag.ContinueOnError)
	flags.SetOutput(ioDiscard{})
	module := flags.String("module", "", "")
	uri := flags.String("uri", "", "")
	pinFile := flags.String("pin-file", "", "")
	if flags.Parse(arguments) != nil || *module == "" || *uri == "" || *pinFile == "" {
		return errors.New("assert-secret-nonexportable requires module, uri, and pin-file")
	}
	return withVerifierTokenSession(*module, *uri, *pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector verifiermanifest.Selector) error {
		key, err := findOne(module, session, pkcs11.CKO_SECRET_KEY, pkcs11.CKK_GENERIC_SECRET, selector.ID)
		if err != nil {
			return err
		}
		attributes, err := module.GetAttributeValue(session, key, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_SENSITIVE, nil), pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, nil)})
		if err != nil || !bytes.Equal(attribute(attributes, pkcs11.CKA_SENSITIVE), []byte{1}) || !bytes.Equal(attribute(attributes, pkcs11.CKA_EXTRACTABLE), []byte{0}) {
			return errors.New("secret key attributes are exportable")
		}
		value, err := module.GetAttributeValue(session, key, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_VALUE, nil)})
		if err == nil && len(attribute(value, pkcs11.CKA_VALUE)) != 0 {
			return errors.New("secret key export was allowed")
		}
		return nil
	})
}

// publicJWK reads one selected public P-256 object without opening a signer socket or private-key export path.
func publicJWK(modulePath, rawURI, pinFile string) (es256.PublicJWK, error) {
	var public es256.PublicJWK
	err := withTokenSession(modulePath, rawURI, pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector manifest.Selector) error {
		key, err := findOne(module, session, pkcs11.CKO_PUBLIC_KEY, pkcs11.CKK_EC, selector.ID)
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

// computeExpectedVerifier computes the canonical HMAC verifier through the local HSM path for acceptance checks.
func computeExpectedVerifier(modulePath, rawURI, pinFile, identifier, secret string) (string, error) {
	var verifier string
	err := withVerifierTokenSession(modulePath, rawURI, pinFile, func(module *pkcs11.Ctx, session pkcs11.SessionHandle, selector verifiermanifest.Selector) error {
		input, err := externalVerifierInput(identifier, secret)
		if err != nil {
			return err
		}
		key, err := findOne(module, session, pkcs11.CKO_SECRET_KEY, pkcs11.CKK_GENERIC_SECRET, selector.ID)
		if err != nil {
			return err
		}
		if err := module.SignInit(session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_SHA256_HMAC, nil)}, key); err != nil {
			return err
		}
		mac, err := module.Sign(session, input)
		if err != nil {
			return err
		}
		verifier = base64.RawURLEncoding.EncodeToString(mac)
		return nil
	})
	return verifier, err
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

// withVerifierTokenSession creates one authenticated local PKCS#11 session for the verifier path.
func withVerifierTokenSession(modulePath, rawURI, pinFile string, operation func(*pkcs11.Ctx, pkcs11.SessionHandle, verifiermanifest.Selector) error) error {
	selector, err := verifiermanifest.ParseSelector(rawURI)
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

// secretKeyTemplate defines the only local HMAC-generation attributes: token-resident, sensitive, non-extractable generic secret material.
func secretKeyTemplate(id []byte, label string) []*pkcs11.Attribute {
	return []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS, pkcs11.CKO_SECRET_KEY), pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, pkcs11.CKK_GENERIC_SECRET), pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true), pkcs11.NewAttribute(pkcs11.CKA_PRIVATE, true), pkcs11.NewAttribute(pkcs11.CKA_LABEL, label), pkcs11.NewAttribute(pkcs11.CKA_ID, id), pkcs11.NewAttribute(pkcs11.CKA_VALUE_LEN, 32), pkcs11.NewAttribute(pkcs11.CKA_SENSITIVE, true), pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, false), pkcs11.NewAttribute(pkcs11.CKA_SIGN, true), pkcs11.NewAttribute(pkcs11.CKA_VERIFY, true)}
}

// findOne resolves exactly one EC key object by the selector's binary CKA_ID without provider-order fallback.
func findOne(module *pkcs11.Ctx, session pkcs11.SessionHandle, class uint, keyType uint, id []byte) (pkcs11.ObjectHandle, error) {
	attributes := []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS, class), pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, keyType), pkcs11.NewAttribute(pkcs11.CKA_ID, id)}
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

// externalVerifierInput mirrors the frozen Auth-side canonical verifier input exactly.
func externalVerifierInput(identifier, secret string) ([]byte, error) {
	identifierBytes, err := base64.RawURLEncoding.DecodeString(identifier)
	if err != nil || base64.RawURLEncoding.EncodeToString(identifierBytes) != identifier || len(identifierBytes) != 18 {
		return nil, errors.New("invalid identifier")
	}
	secretBytes, err := base64.RawURLEncoding.DecodeString(secret)
	if err != nil || base64.RawURLEncoding.EncodeToString(secretBytes) != secret || len(secretBytes) != 32 {
		return nil, errors.New("invalid secret")
	}
	return bytes.Join([][]byte{[]byte("oes.auth.external-api-key-verifier/v1"), {0}, []byte(identifier), {0}, secretBytes}, nil), nil
}

// verifierEntry renders one UTC verifier manifest timeline while preserving the fixed active-or-verify-only state.
func verifierEntry(uri, version string, state verifiermanifest.State, activatedAt time.Time) verifiermanifest.Entry {
	return verifiermanifest.Entry{PKCS11URI: uri, VerifierKeyVersion: version, State: state, ActivatedAt: activatedAt.Format(time.RFC3339)}
}

// verifierEntryWithVerifyOnly renders one verify-only verifier manifest timeline with explicit retirement timing.
func verifierEntryWithVerifyOnly(uri, version string, activatedAt, verifyOnlyAt, retireAfter time.Time) verifiermanifest.Entry {
	return verifiermanifest.Entry{PKCS11URI: uri, VerifierKeyVersion: version, State: verifiermanifest.VerifyOnly, ActivatedAt: activatedAt.Format(time.RFC3339), VerifyOnlyAt: verifyOnlyAt.Format(time.RFC3339), RetireAfter: retireAfter.Format(time.RFC3339)}
}

// verifierCompromisedEntry renders one terminal compromised-disabled verifier record with immutable safe evidence only.
func verifierCompromisedEntry(uri, version, incidentReference, stateRevision string, occurredAt time.Time) verifiermanifest.Entry {
	return verifiermanifest.Entry{PKCS11URI: uri, VerifierKeyVersion: version, State: verifiermanifest.CompromisedDisabled, IncidentReference: incidentReference, OccurredAt: occurredAt.Format(time.RFC3339), StateRevision: stateRevision}
}

type verifierStatusResponse struct {
	ActiveVerifierKeyVersion string                  `json:"activeVerifierKeyVersion"`
	Versions                 []verifierStatusVersion `json:"versions"`
}

type verifierStatusVersion struct {
	VerifierKeyVersion      string `json:"verifierKeyVersion"`
	State                   string `json:"state"`
	ActivatedAtUnixSeconds  int64  `json:"activatedAtUnixSeconds,omitempty"`
	VerifyOnlyAtUnixSeconds int64  `json:"verifyOnlyAtUnixSeconds,omitempty"`
	RetireAfterUnixSeconds  int64  `json:"retireAfterUnixSeconds,omitempty"`
	IncidentReference       string `json:"incidentReference,omitempty"`
	OccurredAtUnixSeconds   int64  `json:"occurredAtUnixSeconds,omitempty"`
	StateRevision           string `json:"stateRevision,omitempty"`
}

type verifierResponse struct {
	Verifier           string `json:"verifier"`
	VerifierKeyVersion string `json:"verifierKeyVersion"`
}

// findVerifierStatusVersion locates one logical verifier version in the read-only readiness response.
func findVerifierStatusVersion(versions []verifierStatusVersion, version string) (verifierStatusVersion, bool) {
	for _, candidate := range versions {
		if candidate.VerifierKeyVersion == version {
			return candidate, true
		}
	}
	return verifierStatusVersion{}, false
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
