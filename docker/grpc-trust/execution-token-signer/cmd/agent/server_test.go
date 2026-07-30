package main

import "testing"

// TestConfiguredSocketRequired rejects a missing pod-local UDS endpoint before agent bootstrap.
func TestConfiguredSocketRequired(t *testing.T) {
	if err := validateConfig("", "module", "ref", "manifest"); err == nil {
		t.Fatal("socket must be required")
	}
}

// TestLeaseDurationRejectsUnsafeValues keeps credential sessions bounded and refreshable.
func TestLeaseDurationRejectsUnsafeValues(t *testing.T) {
	if _, err := parseLeaseDuration("0"); err == nil {
		t.Fatal("zero lease accepted")
	}
}
