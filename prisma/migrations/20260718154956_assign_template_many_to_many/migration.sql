/*
  Warnings:

  - You are about to drop the column `assignedTemplateId` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_FicheTemplateToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FicheTemplateToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "fiche_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FicheTemplateToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("createdAt", "id", "name", "passwordHash", "role", "username") SELECT "createdAt", "id", "name", "passwordHash", "role", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_FicheTemplateToUser_AB_unique" ON "_FicheTemplateToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_FicheTemplateToUser_B_index" ON "_FicheTemplateToUser"("B");
