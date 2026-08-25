-- CreateEnum
CREATE TYPE "LoginMethodType" AS ENUM ('EMAIL', 'PHONE', 'OAUTH_OPENID', 'TERMINAL_PIN');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('PASSWORD', 'EMAIL_OTP', 'PHONE_OTP', 'OAUTH', 'TERMINAL_PIN');

-- CreateEnum
CREATE TYPE "PasswordSetupReason" AS ENUM ('FIRST_LOGIN', 'ADMIN_RESET', 'SECURITY_POLICY');

-- CreateEnum
CREATE TYPE "TerminalPinResetReason" AS ENUM ('ADMIN_RESET', 'SECURITY_POLICY');

-- CreateEnum
CREATE TYPE "TenantMfaScenario" AS ENUM ('LOGIN', 'NEW_DEVICE_LOGIN', 'CHANGE_PASSWORD', 'CHANGE_CONTACT');

-- CreateEnum
CREATE TYPE "ScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "OTPType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "OTPUsage" AS ENUM ('LOGIN', 'REGISTER', 'RESET_PASSWORD', 'MFA_VERIFY');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'MINI_PROGRAM', 'MOBILE_APP', 'DESKTOP_APP', 'PDA');

-- CreateEnum
CREATE TYPE "MfaType" AS ENUM ('TOTP', 'EMAIL_OTP', 'SMS_OTP', 'BACKUP_CODE', 'PUSH_NOTIFICATION', 'HARDWARE_TOKEN', 'BIOMETRIC');

-- AlterTable
ALTER TABLE "ExternalApiKeyCredential" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "LoginMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LoginMethodType" NOT NULL,
    "identifier" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "loginMethodId" TEXT NOT NULL,
    "credentialType" "CredentialType" NOT NULL,
    "hashedValue" TEXT,
    "provider" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordSetupRequirement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "reason" "PasswordSetupReason" NOT NULL,
    "requiredBy" TEXT,
    "requiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordSetupRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerminalPinResetRequirement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "reason" "TerminalPinResetReason" NOT NULL,
    "requiredBy" TEXT,
    "requiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminalPinResetRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "type" "OTPType" NOT NULL DEFAULT 'EMAIL',
    "usage" "OTPUsage" NOT NULL,
    "identifier" TEXT NOT NULL,
    "hashedValue" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempt" INTEGER NOT NULL DEFAULT 1,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordRecoveryGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginMethodId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordRecoveryGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentAccountId" TEXT,
    "loginMethodId" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "refreshTokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaBinding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaType" NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMfaScenarioPolicy" (
    "tenantId" TEXT NOT NULL,
    "scenario" "TenantMfaScenario" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMfaScenarioPolicy_pkey" PRIMARY KEY ("tenantId","scenario")
);

-- CreateTable
CREATE TABLE "TenantMfaFactorPolicy" (
    "tenantId" TEXT NOT NULL,
    "factor" "MfaType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMfaFactorPolicy_pkey" PRIMARY KEY ("tenantId","factor")
);

-- CreateTable
CREATE TABLE "PlatformMfaScenarioPolicy" (
    "scopeKey" TEXT NOT NULL,
    "scenario" "TenantMfaScenario" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMfaScenarioPolicy_pkey" PRIMARY KEY ("scopeKey","scenario")
);

-- CreateTable
CREATE TABLE "PlatformMfaFactorPolicy" (
    "scopeKey" TEXT NOT NULL,
    "factor" "MfaType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMfaFactorPolicy_pkey" PRIMARY KEY ("scopeKey","factor")
);

-- CreateTable
CREATE TABLE "TerminalLoginPolicy" (
    "id" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "enabledLoginFlows" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminalLoginPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformTerminalMfaPolicy" (
    "id" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "loginMfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "newDeviceMfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "allowedFactors" JSONB NOT NULL,
    "factorPriority" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTerminalMfaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantTerminalMfaPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "loginMfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "newDeviceMfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "allowedFactors" JSONB NOT NULL,
    "factorPriority" JSONB NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantTerminalMfaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeLevel" "ScopeLevel" NOT NULL DEFAULT 'TENANT',
    "scopeKey" TEXT NOT NULL DEFAULT '',
    "tenantId" TEXT,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "browser" TEXT,
    "platform" TEXT,
    "userAgent" TEXT,
    "lastIpAddress" TEXT,
    "trustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginMethod_type_identifier_key" ON "LoginMethod"("type", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordSetupRequirement_userId_key" ON "PasswordSetupRequirement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TerminalPinResetRequirement_userId_key" ON "TerminalPinResetRequirement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OTP_identifier_usage_key" ON "OTP"("identifier", "usage");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordRecoveryGrant_challengeId_key" ON "PasswordRecoveryGrant"("challengeId");

-- CreateIndex
CREATE INDEX "PasswordRecoveryGrant_userId_createdAt_idx" ON "PasswordRecoveryGrant"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordRecoveryGrant_loginMethodId_idx" ON "PasswordRecoveryGrant"("loginMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "UserSession_refreshTokenHash_idx" ON "UserSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_revoked_idx" ON "UserSession"("userId", "revoked");

-- CreateIndex
CREATE UNIQUE INDEX "MfaBinding_userId_type_key" ON "MfaBinding"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TerminalLoginPolicy_terminal_key" ON "TerminalLoginPolicy"("terminal");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTerminalMfaPolicy_terminal_key" ON "PlatformTerminalMfaPolicy"("terminal");

-- CreateIndex
CREATE INDEX "TenantTerminalMfaPolicy_tenantId_idx" ON "TenantTerminalMfaPolicy"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantTerminalMfaPolicy_tenantId_terminal_key" ON "TenantTerminalMfaPolicy"("tenantId", "terminal");

-- CreateIndex
CREATE INDEX "TrustedDevice_scopeKey_userId_idx" ON "TrustedDevice"("scopeKey", "userId");

-- CreateIndex
CREATE INDEX "TrustedDevice_scopeKey_userId_revokedAt_idx" ON "TrustedDevice"("scopeKey", "userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_userId_scopeKey_deviceId_key" ON "TrustedDevice"("userId", "scopeKey", "deviceId");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_loginMethodId_fkey" FOREIGN KEY ("loginMethodId") REFERENCES "LoginMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "MachineWorkloadSourceCredential_machinePrincipalId_expiresAt_id" RENAME TO "MachineWorkloadSourceCredential_machinePrincipalId_expiresA_idx";

-- RenameIndex
ALTER INDEX "MachineWorkloadSourceCredential_machineWorkloadBindingId_status" RENAME TO "MachineWorkloadSourceCredential_machineWorkloadBindingId_st_idx";
