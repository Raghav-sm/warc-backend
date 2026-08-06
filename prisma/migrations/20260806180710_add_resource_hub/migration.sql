-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('link', 'file');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('public', 'private');

-- CreateTable
CREATE TABLE "resources" (
    "resource_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_type" TEXT,
    "size" INTEGER,
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'public',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "resources_pkey" PRIMARY KEY ("resource_id")
);

-- CreateTable
CREATE TABLE "resource_access" (
    "resource_access_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "resource_access_pkey" PRIMARY KEY ("resource_access_id")
);

-- CreateIndex
CREATE INDEX "resources_project_id_idx" ON "resources"("project_id");

-- CreateIndex
CREATE INDEX "resource_access_user_id_idx" ON "resource_access"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_access_resource_id_user_id_key" ON "resource_access"("resource_id", "user_id");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_access" ADD CONSTRAINT "resource_access_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("resource_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_access" ADD CONSTRAINT "resource_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
