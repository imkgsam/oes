CREATE UNIQUE INDEX IF NOT EXISTS "APIKey_hashedValue_key"
ON "APIKey"("hashedValue");
