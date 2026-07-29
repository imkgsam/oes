// Package manifest validates deployment-owned PKCS#11 selectors and rotation timelines before any HSM session opens.
package manifest
import("errors";"strings";"time")
type Selector struct{TokenSerial,ID string}
func ParseSelector(raw string)(Selector,error){if !strings.HasPrefix(raw,"pkcs11:"){return Selector{},errors.New("invalid PKCS#11 URI")};v:=map[string]string{};for _,p:=range strings.Split(strings.TrimPrefix(raw,"pkcs11:"),";"){x:=strings.SplitN(p,"=",2);if len(x)==2{v[x[0]]=x[1]}};if v["serial"]==""||v["id"]==""||v["type"]!="private"{return Selector{},errors.New("PKCS#11 URI must pin serial/id/type=private")};return Selector{v["serial"],v["id"]},nil}
type Entry struct{PKCS11URI,ExpectedKID,PublishNotBefore,SigningNotBefore,SigningNotAfter,RetireAfter string}
func(e Entry)Validate()error{if _,x:=ParseSelector(e.PKCS11URI);x!=nil{return x};if e.ExpectedKID==""{return errors.New("kid required")};p,x:=time.Parse(time.RFC3339,e.PublishNotBefore);if x!=nil{return x};s,x:=time.Parse(time.RFC3339,e.SigningNotBefore);if x!=nil{return x};a,x:=time.Parse(time.RFC3339,e.SigningNotAfter);if x!=nil{return x};r,x:=time.Parse(time.RFC3339,e.RetireAfter);if x!=nil||s.Before(p)||!a.After(s)||r.Before(a.Add(6*time.Minute)){return errors.New("invalid rotation timeline")};return nil}
