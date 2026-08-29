-- CreateEnum
CREATE TYPE "EmployeeLifecycleStatus" AS ENUM ('PREBOARDING', 'ACTIVE', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "OnboardingAccessStatus" AS ENUM ('COMPLETED', 'ACCOUNT_BINDING_PENDING', 'ACCESS_GRANT_PENDING');

-- CreateTable
CREATE TABLE "Employee" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "tenantPartyId" VARCHAR(100) NOT NULL,
    "employeeCode" VARCHAR(4) NOT NULL,
    "lifecycleStatus" "EmployeeLifecycleStatus" NOT NULL DEFAULT 'PREBOARDING',
    "officialPhotoAssetId" VARCHAR(100),
    "officialPhotoUrl" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employment" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "employeeId" UUID NOT NULL,
    "orgUnitId" VARCHAR(100) NOT NULL,
    "positionName" VARCHAR(200),
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "endedReason" VARCHAR(500),
    "activeSlot" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOnboardingAccess" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "employeeId" UUID NOT NULL,
    "employmentId" UUID NOT NULL,
    "accountId" VARCHAR(100),
    "status" "OnboardingAccessStatus" NOT NULL,
    "grantIdempotencyKey" VARCHAR(200),
    "failureReason" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeOnboardingAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employee_tenantId_idx" ON "Employee"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tenantId_tenantPartyId_key" ON "Employee"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tenantId_employeeCode_key" ON "Employee"("tenantId", "employeeCode");

-- CreateIndex
CREATE INDEX "Employment_tenantId_employeeId_idx" ON "Employment"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "Employment_tenantId_orgUnitId_idx" ON "Employment"("tenantId", "orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Employment_tenantId_employeeId_activeSlot_key" ON "Employment"("tenantId", "employeeId", "activeSlot");

-- CreateIndex
CREATE INDEX "EmployeeOnboardingAccess_tenantId_status_idx" ON "EmployeeOnboardingAccess"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeOnboardingAccess_tenantId_employeeId_employmentId_key" ON "EmployeeOnboardingAccess"("tenantId", "employeeId", "employmentId");

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOnboardingAccess" ADD CONSTRAINT "EmployeeOnboardingAccess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOnboardingAccess" ADD CONSTRAINT "EmployeeOnboardingAccess_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "Employment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
