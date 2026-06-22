-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);
