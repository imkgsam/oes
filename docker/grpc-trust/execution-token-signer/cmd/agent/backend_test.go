package main

import (
	"errors"
	"testing"
)

type fake struct{ closed bool }

// GetActiveKey returns the fake public-key error used to assert dispatch propagation.
func (f *fake) GetActiveKey() (KeyResponse, error) { return KeyResponse{}, ErrPrivateExport }

// ListPublishedKeys returns the same fake protected-provider error.
func (f *fake) ListPublishedKeys() ([]KeyResponse, error) { return nil, ErrPrivateExport }

// SignES256 does not sign because this fake only tests closed dispatch behavior.
func (f *fake) SignES256(string, []byte) ([]byte, error) { return nil, errors.New("unused") }

// Close records that agent shutdown releases provider state.
func (f *fake) Close() error { f.closed = true; return nil }

// TestBackendAlwaysCloses proves the public shutdown helper releases protected session state.
func TestBackendAlwaysCloses(t *testing.T) {
	fake := &fake{}
	_ = CloseBackend(fake)
	if !fake.closed {
		t.Fatal("session cleanup required")
	}
}

// TestDispatchUsesBackendOnly rejects unknown methods and forwards known calls to the fixed backend interface.
func TestDispatchUsesBackendOnly(t *testing.T) {
	fake := &fake{}
	if _, err := Dispatch(fake, "GetActiveKey", []byte(`{}`)); err != ErrPrivateExport {
		t.Fatal("backend error must propagate")
	}
	if _, err := Dispatch(fake, "SelectKey", []byte(`{}`)); err == nil {
		t.Fatal("arbitrary key method accepted")
	}
}
