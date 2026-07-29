package main

import (
	"testing"
	"time"
)

// TestEntryBuildsAValidSixMinuteRetirementWindow proves host manifests keep active and overlap keys valid for the frozen retention interval.
func TestEntryBuildsAValidSixMinuteRetirementWindow(t *testing.T) {
	now := time.Date(2026, 7, 29, 12, 0, 0, 0, time.UTC)
	entry := entry("pkcs11:serial=serial;id=%01;type=private", "kid", now.Add(-10*time.Minute), now.Add(-5*time.Minute), now.Add(5*time.Minute), now.Add(11*time.Minute))
	if err := entry.Validate(); err != nil {
		t.Fatal(err)
	}
}
