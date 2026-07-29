package main
import "testing"
import "encoding/base64"
func TestSigningFailsClosedWithoutSession(t *testing.T){a:=&PKCS11Adapter{};if _,e:=a.SignES256([]byte("x"));e==nil{t.Fatal("unavailable session accepted")}}
func TestLookupFailsClosedWithoutSessionOrSelector(t *testing.T){a:=&PKCS11Adapter{};if _,e:=a.FindPrivateKey(nil);e==nil{t.Fatal("empty selector accepted")};if _,e:=a.FindPrivateKey([]byte{1});e==nil{t.Fatal("unavailable session accepted")}}
func TestLoginFailsClosedWithoutCredentialOrSession(t *testing.T){a:=&PKCS11Adapter{};if e:=a.Login("");e==nil{t.Fatal("empty credential accepted")};if e:=a.Login("opaque");e==nil{t.Fatal("unavailable session accepted")}}
func TestES256KidIsCanonical(t *testing.T){if ES256Kid("x","y")==""{t.Fatal("kid missing")};if _,e:=base64.RawURLEncoding.DecodeString(ES256Kid("x","y"));e!=nil{t.Fatal(e)}}
