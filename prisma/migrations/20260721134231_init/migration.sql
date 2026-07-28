-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiche_templates" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiche_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiche_instances" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "numeroOT" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "centreCharge" TEXT NOT NULL,
    "superviseur" TEXT NOT NULL,
    "datePrevue" TIMESTAMP(3) NOT NULL,
    "dateFinPrevue" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BROUILLON',
    "machinisteNom" TEXT,
    "dateEntretien" TIMESTAMP(3),
    "actionsCochees" TEXT,
    "heureDebut" TEXT,
    "heureFin" TEXT,
    "observation" TEXT,
    "chefEquipeNom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiche_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiche_signatures" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiche_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FicheTemplateToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_templates_ref_key" ON "fiche_templates"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_instances_numeroOT_key" ON "fiche_instances"("numeroOT");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_signatures_ficheId_role_key" ON "fiche_signatures"("ficheId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "_FicheTemplateToUser_AB_unique" ON "_FicheTemplateToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_FicheTemplateToUser_B_index" ON "_FicheTemplateToUser"("B");

-- AddForeignKey
ALTER TABLE "fiche_instances" ADD CONSTRAINT "fiche_instances_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "fiche_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_signatures" ADD CONSTRAINT "fiche_signatures_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiche_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_signatures" ADD CONSTRAINT "fiche_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FicheTemplateToUser" ADD CONSTRAINT "_FicheTemplateToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "fiche_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FicheTemplateToUser" ADD CONSTRAINT "_FicheTemplateToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
