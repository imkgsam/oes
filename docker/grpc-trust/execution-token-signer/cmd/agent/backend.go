// Package main contains the agent-owned PKCS#11 boundary; Auth never receives a private key or raw session handle.
package main

import "errors"

// Backend is implemented by the PKCS#11 adapter and is deliberately limited to public facts and ES256 signing.
type Backend interface { ActivePublicKey() (map[string]string,error); SignES256([]byte) ([]byte,error); Close() error }
// Dispatch binds the frozen methods to one agent-owned backend and never accepts caller key selection.
func Dispatch(b Backend, method string, input []byte)(any,error){if b==nil{return nil,errors.New("protected provider unavailable")};switch method{case "GetActiveKey":return b.ActivePublicKey();case "ListPublishedKeys":k,e:=b.ActivePublicKey();if e!=nil{return nil,e};return []map[string]string{k},nil;case "SignEs256":return b.SignES256(input);default:return nil,errors.New("method forbidden")}}
// withBackend guarantees fail-closed cleanup after every protected operation.
func withBackend(b Backend, op func() error) error { defer b.Close(); if err:=op();err!=nil{return err};return nil }
var ErrPrivateExport = errors.New("private key export is forbidden")
