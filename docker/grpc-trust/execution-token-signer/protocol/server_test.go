package protocol
import("bytes";"testing";"encoding/json")
func TestServeRejectsUnknownMethod(t *testing.T){in:=bytes.NewBufferString(`{"jsonrpc":"2.0","id":1,"method":"ExportPrivateKey"}`+"\n");out:=new(bytes.Buffer);Serve(in,out,func(string,json.RawMessage)(any,error){t.Fatal("backend called");return nil,nil});if !bytes.Contains(out.Bytes(),[]byte("method forbidden")){t.Fatal("unknown method accepted")}}
