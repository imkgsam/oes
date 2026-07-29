package main
import "testing"
func TestConfiguredSocketRequired(t *testing.T){if err:=validateConfig("","module","ref");err==nil{t.Fatal("socket must be required")}}
