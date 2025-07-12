-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HR', 'MGM', 'GM', 'SECURITY');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING_MGM', 'APPROVED_BY_MGM_PENDING_GM', 'APPROVED_BY_GM_PENDING_SECURITY', 'APPROVED_FINAL', 'REJECTED_BY_MGM', 'REJECTED_BY_GM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_writtenById_fkey" FOREIGN KEY ("writtenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
