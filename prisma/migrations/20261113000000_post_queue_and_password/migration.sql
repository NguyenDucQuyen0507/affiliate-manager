-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'PUBLISHING';

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_channelId_fkey";

-- DropIndex
DROP INDEX "Post_dealId_channelId_key";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "externalCommentId" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Post_dealId_idx" ON "Post"("dealId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

