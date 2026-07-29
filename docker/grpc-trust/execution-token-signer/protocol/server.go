package protocol
import("bufio";"encoding/json";"io")
type Request struct{JSONRPC string `json:"jsonrpc"`;ID json.RawMessage `json:"id"`;Method string `json:"method"`;Params json.RawMessage `json:"params"`}
type Reply struct{JSONRPC string `json:"jsonrpc"`;ID json.RawMessage `json:"id"`;Result any `json:"result,omitempty"`;Error *Error `json:"error,omitempty"`}
type Error struct{Code int `json:"code"`;Message string `json:"message"`}
// Serve handles newline-delimited JSON-RPC and rejects malformed or non-frozen methods before backend use.
func Serve(r io.Reader,w io.Writer,invoke func(string,json.RawMessage)(any,error)){s:=bufio.NewScanner(r);for s.Scan(){var q Request;reply:=Reply{JSONRPC:"2.0"};if json.Unmarshal(s.Bytes(),&q)!=nil||q.JSONRPC!="2.0"||!Allowed(q.Method){reply.Error=&Error{-32601,"method forbidden"}}else{reply.ID=q.ID;v,e:=invoke(q.Method,q.Params);if e!=nil{reply.Error=&Error{-32000,"protected provider unavailable"}}else{reply.Result=v}};json.NewEncoder(w).Encode(reply)}}
