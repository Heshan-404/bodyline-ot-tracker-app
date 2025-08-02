-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HR', 'MANAGER', 'DGM', 'GM', 'SECURITY');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING_MANAGER_APPROVAL', 'APPROVED_BY_MANAGER_PENDING_DGM', 'PENDING_DGM', 'APPROVED_BY_DGM_PENDING_GM', 'APPROVED_FINAL', 'REJECTED_BY_MANAGER', 'REJECTED_BY_DGM', 'REJECTED_BY_GM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "sectionId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ReceiptStatus" NOT NULL,
    "writtenById" TEXT NOT NULL,
    "currentApproverRole" "UserRole",
    "lastActionByRole" "UserRole",
    "rejectionReason" TEXT,
    "managerActionBy" TEXT,
    "dgmActionBy" TEXT,
    "gmActionBy" TEXT,
    "securityActionBy" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "Section"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_writtenById_fkey" FOREIGN KEY ("writtenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
