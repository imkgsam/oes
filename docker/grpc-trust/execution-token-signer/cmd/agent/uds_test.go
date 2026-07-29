package main
import("encoding/json";"testing")
func TestServeUnixRejectsEmptyPath(t *testing.T){if e:=ServeUnix("",func(string,json.RawMessage)(any,error){return nil,nil});e==nil{t.Fatal("socket path required")}}
