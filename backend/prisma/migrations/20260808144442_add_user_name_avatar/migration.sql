-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarPath" VARCHAR(500);
ALTER TABLE "User" ADD COLUMN "name" VARCHAR(100) NOT NULL DEFAULT 'Usuário';

-- Remove default after backfill
ALTER TABLE "User" ALTER COLUMN "name" DROP DEFAULT;
