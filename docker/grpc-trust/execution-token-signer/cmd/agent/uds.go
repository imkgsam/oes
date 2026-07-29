package main
import("encoding/json";"net";"os";"oes/execution-token-signer-agent/protocol")
// ServeUnix exposes the frozen protocol only over the configured pod-local Unix socket.
func ServeUnix(path string, invoke func(string,json.RawMessage)(any,error))error{if path==""{return validateConfig("","m","k")};_ = os.Remove(path);l,e:=net.Listen("unix",path);if e!=nil{return e};for{c,e:=l.Accept();if e!=nil{return e};go func(){defer c.Close();protocol.Serve(c,c,invoke)}()}}
