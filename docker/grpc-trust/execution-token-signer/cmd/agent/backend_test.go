package main
import("testing";"errors")
type fake struct{closed bool};func(f *fake)ActivePublicKey()(map[string]string,error){return nil,ErrPrivateExport};func(f *fake)SignES256([]byte)([]byte,error){return nil,errors.New("unused")};func(f *fake)Close()error{f.closed=true;return nil}
func TestBackendAlwaysCloses(t *testing.T){f:=&fake{};_ = withBackend(f,func()error{return ErrPrivateExport});if !f.closed{t.Fatal("session cleanup required")}}
func TestDispatchUsesBackendOnly(t *testing.T){f:=&fake{};if _,e:=Dispatch(f,"GetActiveKey",nil);e!=ErrPrivateExport{t.Fatal("backend error must propagate")};if _,e:=Dispatch(f,"SelectKey",nil);e==nil{t.Fatal("arbitrary key method accepted")}}
