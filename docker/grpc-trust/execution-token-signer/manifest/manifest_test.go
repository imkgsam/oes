package manifest
import "testing"
func TestSelectorRejectsUnpinnedURI(t *testing.T){if _,e:=ParseSelector("pkcs11:token=a;id=%01;type=private");e==nil{t.Fatal("serial required")}}
func TestTimelineRejectsEarlyRetirement(t *testing.T){e:=Entry{PKCS11URI:"pkcs11:token=a;serial=s;id=%01;type=private",ExpectedKID:"kid",PublishNotBefore:"2026-01-01T00:00:00Z",SigningNotBefore:"2026-01-01T00:05:00Z",SigningNotAfter:"2026-01-02T00:00:00Z",RetireAfter:"2026-01-02T00:06:00Z"};if e.Validate()!=nil{t.Fatal("valid timeline rejected")};e.RetireAfter="2026-01-02T00:00:30Z";if e.Validate()==nil{t.Fatal("retirement window accepted")}}
