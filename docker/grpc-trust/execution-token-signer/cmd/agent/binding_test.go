package main
import("testing";"oes/execution-token-signer-agent/manifest")
func TestBindRejectsInvalidManifest(t *testing.T){_,e:=Bind(manifest.Entry{});if e==nil{t.Fatal("invalid manifest accepted")}}
func TestBindingRejectsPublicKidMismatch(t *testing.T){b:=Binding{ExpectedKID:"wrong"};if b.VerifyPublicKid("x","y")==nil{t.Fatal("kid mismatch accepted")}}
