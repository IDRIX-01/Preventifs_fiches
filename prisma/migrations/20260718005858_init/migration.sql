-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fiche_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ref" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "equipement" TEXT NOT NULL,
    "systeme" TEXT NOT NULL,
    "intervention" TEXT NOT NULL,
    "epi" TEXT NOT NULL,
    "consignesA" TEXT NOT NULL,
    "consignesNe" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "ressources" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fiche_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "numeroOT" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "centreCharge" TEXT NOT NULL,
    "superviseur" TEXT NOT NULL,
    "datePrevue" DATETIME NOT NULL,
    "dateFinPrevue" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BROUILLON',
    "machinisteNom" TEXT,
    "actionsCochees" TEXT,
    "heureDebut" TEXT,
    "heureFin" TEXT,
    "observation" TEXT,
    "chefEquipeNom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fiche_instances_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "fiche_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fiche_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ficheId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fiche_signatures_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiche_instances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fiche_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_templates_ref_key" ON "fiche_templates"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_instances_numeroOT_key" ON "fiche_instances"("numeroOT");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_signatures_ficheId_role_key" ON "fiche_signatures"("ficheId", "role");
