-- Adds CRM-side legal-name evidence for formal TenantParty registration.
ALTER TABLE "CrmAccount" ADD COLUMN "leadLegalName" VARCHAR(255);
