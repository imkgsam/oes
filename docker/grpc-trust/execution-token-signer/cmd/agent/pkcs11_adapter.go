package main

import (
	"crypto/sha256"
	"errors"
	"strings"
	"time"

	"github.com/miekg/pkcs11"
	"oes/execution-token-signer-agent/internal/es256"
)

var p256OID = []byte{0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07}

// PKCS11Adapter owns module and leased-session state while retaining every private-key handle inside the agent.
type PKCS11Adapter struct {
	module        *pkcs11.Ctx
	session       pkcs11.SessionHandle
	sessionSerial string
	leaseExpires  time.Time
	leaseDuration time.Duration
	now           func() time.Time
}

// OpenPKCS11 initializes the configured module and fails closed before any agent route is served.
func OpenPKCS11(modulePath string, leaseDuration time.Duration) (*PKCS11Adapter, error) {
	if modulePath == "" || leaseDuration <= 0 {
		return nil, errors.New("protected PKCS11 configuration unavailable")
	}
	module := pkcs11.New(modulePath)
	if module == nil {
		return nil, ErrPrivateExport
	}
	if err := module.Initialize(); err != nil {
		module.Destroy()
		return nil, err
	}
	return &PKCS11Adapter{module: module, leaseDuration: leaseDuration, now: time.Now}, nil
}

// ResolveSlot finds exactly the manifest-pinned hardware-token serial and rejects ambiguous discovery.
func (a *PKCS11Adapter) ResolveSlot(serial string) (uint, error) {
	if a == nil || a.module == nil || serial == "" {
		return 0, errors.New("protected token selector unavailable")
	}
	slots, err := a.module.GetSlotList(true)
	if err != nil {
		return 0, err
	}
	var selected uint
	for _, slot := range slots {
		info, err := a.module.GetTokenInfo(slot)
		if err != nil {
			return 0, err
		}
		if strings.TrimSpace(info.SerialNumber) == serial {
			if selected != 0 {
				return 0, errors.New("manifest token serial is ambiguous")
			}
			selected = slot
		}
	}
	if selected == 0 {
		return 0, errors.New("manifest token serial unavailable")
	}
	return selected, nil
}

// EnsureSession refreshes the selected token's bounded credential lease before any protected operation.
func (a *PKCS11Adapter) EnsureSession(serial string, credential CredentialResolver) error {
	if a == nil || a.module == nil {
		return errors.New("protected PKCS11 module unavailable")
	}
	now := a.clock()
	if a.session != 0 && a.sessionSerial == serial && now.Before(a.leaseExpires) {
		return nil
	}
	a.clearSession()
	slot, err := a.ResolveSlot(serial)
	if err != nil {
		return err
	}
	if err := a.OpenSession(slot); err != nil {
		return err
	}
	if credential != nil {
		secret, err := credential.Resolve()
		if err != nil {
			a.clearSession()
			return err
		}
		defer zero(secret)
		if err := a.LoginBytes(secret); err != nil {
			a.clearSession()
			return err
		}
	}
	a.sessionSerial = serial
	a.leaseExpires = now.Add(a.leaseDuration)
	return nil
}

// FindPrivateKey resolves only the agent-validated binary manifest CKA_ID and requires a unique private object.
func (a *PKCS11Adapter) FindPrivateKey(id []byte) (pkcs11.ObjectHandle, error) {
	return a.findKey(pkcs11.CKO_PRIVATE_KEY, id)
}

// FindPublicKey resolves the matching binary manifest CKA_ID and requires one P-256 public object.
func (a *PKCS11Adapter) FindPublicKey(id []byte) (pkcs11.ObjectHandle, error) {
	if a == nil || a.module == nil || a.session == 0 || len(id) == 0 {
		return 0, errors.New("protected public selector unavailable")
	}
	attributes := []*pkcs11.Attribute{
		pkcs11.NewAttribute(pkcs11.CKA_CLASS, pkcs11.CKO_PUBLIC_KEY),
		pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, pkcs11.CKK_EC),
		pkcs11.NewAttribute(pkcs11.CKA_ID, id),
	}
	return a.findUnique(attributes, "manifest selected public key unavailable")
}

// RequireNonExtractablePrivateKey prevents a manifest from binding an exportable signing object.
func (a *PKCS11Adapter) RequireNonExtractablePrivateKey(id []byte) error {
	key, err := a.FindPrivateKey(id)
	if err != nil {
		return err
	}
	attributes, err := a.module.GetAttributeValue(a.session, key, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, nil)})
	if err != nil || len(attributes) != 1 || len(attributes[0].Value) != 1 || attributes[0].Value[0] != 0 {
		return errors.New("manifest selected private key is extractable")
	}
	return nil
}

// PublicJWK derives the ES256 public facts from the matching PKCS#11 public object without touching private material.
func (a *PKCS11Adapter) PublicJWK(binding Binding) (PublicJWK, error) {
	key, err := a.FindPublicKey(binding.Selector.ID)
	if err != nil {
		return PublicJWK{}, err
	}
	attributes, err := a.module.GetAttributeValue(a.session, key, []*pkcs11.Attribute{
		pkcs11.NewAttribute(pkcs11.CKA_EC_PARAMS, nil),
		pkcs11.NewAttribute(pkcs11.CKA_EC_POINT, nil),
	})
	if err != nil || len(attributes) != 2 || !equalAttribute(attributes, pkcs11.CKA_EC_PARAMS, p256OID) {
		return PublicJWK{}, errors.New("manifest selected public key is not P-256")
	}
	public, err := es256.FromDERPoint(valueForAttribute(attributes, pkcs11.CKA_EC_POINT))
	if err != nil {
		return PublicJWK{}, errors.New("manifest selected public point is invalid")
	}
	return PublicJWK(public), nil
}

// SignBindingES256 accepts only an agent-internal manifest binding and hashes the JWS signing input for CKM_ECDSA.
func (a *PKCS11Adapter) SignBindingES256(binding Binding, input []byte) ([]byte, error) {
	if binding.Selector.TokenSerial == "" || len(binding.Selector.ID) == 0 || binding.ExpectedKID == "" {
		return nil, errors.New("manifest binding unavailable")
	}
	return a.SignSelectedES256(binding.Selector.ID, input)
}

// SignSelectedES256 produces the fixed-width 64-byte JOSE r||s output required by ES256.
func (a *PKCS11Adapter) SignSelectedES256(id, input []byte) ([]byte, error) {
	if a == nil || a.module == nil || a.session == 0 || len(id) == 0 || len(input) == 0 {
		return nil, errors.New("protected PKCS11 session unavailable")
	}
	key, err := a.FindPrivateKey(id)
	if err != nil {
		return nil, err
	}
	if err := a.module.SignInit(a.session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_ECDSA, nil)}, key); err != nil {
		return nil, err
	}
	digest := sha256.Sum256(input)
	signature, err := a.module.Sign(a.session, digest[:])
	if err != nil || len(signature) != 64 {
		return nil, errors.New("protected ES256 signing failed")
	}
	return signature, nil
}

// LoginBytes uses a transient credential buffer that callers zero immediately after PKCS#11 login returns.
func (a *PKCS11Adapter) LoginBytes(pin []byte) error {
	if a == nil || a.module == nil || a.session == 0 || len(pin) == 0 {
		return errors.New("protected credential unavailable")
	}
	return a.module.Login(a.session, pkcs11.CKU_USER, string(pin))
}

// OpenSession opens one agent-owned serial session; callers never receive a slot or raw session handle.
func (a *PKCS11Adapter) OpenSession(slot uint) error {
	if a == nil || a.module == nil {
		return errors.New("protected PKCS11 module unavailable")
	}
	session, err := a.module.OpenSession(slot, pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION)
	if err != nil {
		return err
	}
	a.session = session
	return nil
}

// Close tears down the credential lease, session, and provider module when the agent stops.
func (a *PKCS11Adapter) Close() error {
	if a == nil || a.module == nil {
		return nil
	}
	a.clearSession()
	_ = a.module.Finalize()
	a.module.Destroy()
	a.module = nil
	return nil
}

// clock makes bounded-lease behavior deterministic in unit tests while defaulting to wall-clock UTC.
func (a *PKCS11Adapter) clock() time.Time {
	if a.now == nil {
		return time.Now()
	}
	return a.now()
}

// findKey locates one unique private EC key selected by an already-validated binary CKA_ID.
func (a *PKCS11Adapter) findKey(class uint, id []byte) (pkcs11.ObjectHandle, error) {
	if a == nil || a.module == nil || a.session == 0 || len(id) == 0 {
		return 0, errors.New("protected PKCS11 selector unavailable")
	}
	attributes := []*pkcs11.Attribute{
		pkcs11.NewAttribute(pkcs11.CKA_CLASS, class),
		pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE, pkcs11.CKK_EC),
		pkcs11.NewAttribute(pkcs11.CKA_ID, id),
	}
	return a.findUnique(attributes, "manifest selected private key unavailable")
}

// findUnique rejects missing and duplicate objects so the manifest never relies on provider enumeration order.
func (a *PKCS11Adapter) findUnique(attributes []*pkcs11.Attribute, unavailable string) (pkcs11.ObjectHandle, error) {
	if err := a.module.FindObjectsInit(a.session, attributes); err != nil {
		return 0, err
	}
	defer a.module.FindObjectsFinal(a.session)
	objects, _, err := a.module.FindObjects(a.session, 2)
	if err != nil || len(objects) != 1 {
		return 0, errors.New(unavailable)
	}
	return objects[0], nil
}

// clearSession logs out and closes the current lease before a refresh, error, or agent shutdown.
func (a *PKCS11Adapter) clearSession() {
	if a == nil || a.module == nil || a.session == 0 {
		return
	}
	_ = a.module.Logout(a.session)
	_ = a.module.CloseSession(a.session)
	a.session = 0
	a.sessionSerial = ""
	a.leaseExpires = time.Time{}
}

// ES256Kid calculates the RFC7638 SHA-256 thumbprint of canonical ES256 public-JWK members.
func ES256Kid(x, y string) string {
	return es256.Kid(x, y)
}

// decodeDEROctetString unwraps the RFC5912 EC-point octet string returned by compliant PKCS#11 providers.
func decodeDEROctetString(value []byte) ([]byte, error) {
	return es256.DecodeDEROctetString(value)
}

// equalAttribute compares one returned PKCS#11 attribute with the fixed P-256 OID bytes.
func equalAttribute(attributes []*pkcs11.Attribute, typ uint, expected []byte) bool {
	return string(valueForAttribute(attributes, typ)) == string(expected)
}

// valueForAttribute extracts one requested PKCS#11 attribute without accepting unrequested object metadata.
func valueForAttribute(attributes []*pkcs11.Attribute, typ uint) []byte {
	for _, attribute := range attributes {
		if attribute.Type == typ {
			return attribute.Value
		}
	}
	return nil
}

// zero overwrites a resolved optional credential buffer after each lease refresh attempt.
func zero(value []byte) {
	for index := range value {
		value[index] = 0
	}
}

// verifyPublicSignature proves the public object with a manifest CKA_ID is the mate of the non-exportable private object.
func verifyPublicSignature(publicJWK PublicJWK, input, signature []byte) error {
	return es256.Verify(es256.PublicJWK(publicJWK), input, signature)
}
