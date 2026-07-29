package main

import "github.com/miekg/pkcs11"
import "errors"
import "crypto/sha256"
import "encoding/base64"

// PKCS11Adapter owns the provider module lifecycle and never exposes private-key handles beyond the agent process.
type PKCS11Adapter struct { module *pkcs11.Ctx; session pkcs11.SessionHandle }
// FindPrivateKey resolves only the agent-validated manifest CKA_ID, never a request-supplied selector.
func(a *PKCS11Adapter)FindPrivateKey(id []byte)(pkcs11.ObjectHandle,error){if a==nil||a.module==nil||a.session==0||len(id)==0{return 0,errors.New("protected PKCS11 selector unavailable")};if e:=a.module.FindObjectsInit(a.session,[]*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS,pkcs11.CKO_PRIVATE_KEY),pkcs11.NewAttribute(pkcs11.CKA_ID,id)});e!=nil{return 0,e};defer a.module.FindObjectsFinal(a.session);objects,_,e:=a.module.FindObjects(a.session,1);if e!=nil||len(objects)!=1{return 0,errors.New("manifest selected private key unavailable")};return objects[0],nil}
// Login performs the agent-owned CKU_USER authentication; the opaque credential is never returned to Auth or callers.
func(a *PKCS11Adapter)Login(pin string)error{if a==nil||a.module==nil||a.session==0||pin==""{return errors.New("protected credential unavailable")};return a.module.Login(a.session,pkcs11.CKU_USER,pin)}
// SignBindingES256 accepts only a prevalidated agent-internal manifest binding.
func(a *PKCS11Adapter)SignBindingES256(binding Binding,input []byte)([]byte,error){if binding.Selector.ID==""||binding.ExpectedKID==""{return nil,errors.New("manifest binding unavailable")};return a.SignSelectedES256([]byte(binding.Selector.ID),input)}
// FindPublicKey resolves the matching manifest CKA_ID and requires an EC public-key object.
func(a *PKCS11Adapter)FindPublicKey(id []byte)(pkcs11.ObjectHandle,error){if a==nil||a.module==nil||a.session==0||len(id)==0{return 0,errors.New("protected public selector unavailable")};if e:=a.module.FindObjectsInit(a.session,[]*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_CLASS,pkcs11.CKO_PUBLIC_KEY),pkcs11.NewAttribute(pkcs11.CKA_KEY_TYPE,pkcs11.CKK_EC),pkcs11.NewAttribute(pkcs11.CKA_ID,id)});e!=nil{return 0,e};defer a.module.FindObjectsFinal(a.session);o,_,e:=a.module.FindObjects(a.session,1);if e!=nil||len(o)!=1{return 0,errors.New("manifest selected public key unavailable")};return o[0],nil}
// Kid derives the frozen base64url SHA-256 public-fact thumbprint without retaining private material.
func Kid(publicFacts []byte)string{h:=sha256.Sum256(publicFacts);return base64.RawURLEncoding.EncodeToString(h[:])}
// ES256Kid hashes the RFC7638 canonical ES256 public-JWK members in lexical member order.
func ES256Kid(x,y string)string{return Kid([]byte(`{"crv":"P-256","kty":"EC","x":"`+x+`","y":"`+y+`"}`))}
// OpenSession opens one agent-owned session; callers never receive slot, handle, PIN, or selector control.
func(a *PKCS11Adapter)OpenSession(slot uint)error{if a==nil||a.module==nil{return errors.New("protected PKCS11 module unavailable")};s,e:=a.module.OpenSession(slot,pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION);if e!=nil{return e};a.session=s;return nil}
// OpenPKCS11 initializes the configured module and fails closed before any agent route is served.
func OpenPKCS11(modulePath string) (*PKCS11Adapter,error) { m:=pkcs11.New(modulePath); if m==nil{return nil,ErrPrivateExport}; if e:=m.Initialize();e!=nil{return nil,e}; return &PKCS11Adapter{module:m},nil }
// Close logs out, closes the owned session, finalizes and destroys the provider module.
func(a *PKCS11Adapter)Close()error{if a.module==nil{return nil};if a.session!=0{_ = a.module.Logout(a.session);_ = a.module.CloseSession(a.session)};_ = a.module.Finalize();a.module.Destroy();a.module=nil;return nil}
// SignES256 refuses empty payloads or unavailable sessions; key lookup is agent-owned and never caller-selected.
func(a *PKCS11Adapter)SignSelectedES256(id,input []byte)([]byte,error){if a==nil||a.module==nil||a.session==0||len(id)==0||len(input)==0{return nil,errors.New("protected PKCS11 session unavailable")};key,e:=a.FindPrivateKey(id);if e!=nil{return nil,e};if e=a.module.SignInit(a.session,[]*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_ECDSA,nil)},key);e!=nil{return nil,e};sig,e:=a.module.Sign(a.session,input);if e!=nil||len(sig)!=64{return nil,errors.New("protected ES256 signing failed")};return sig,nil}
func(a *PKCS11Adapter)SignES256(input []byte)([]byte,error){return nil,errors.New("manifest selected key required")}
