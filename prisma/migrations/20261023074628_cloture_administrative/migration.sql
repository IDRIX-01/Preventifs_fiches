-- AlterTable
ALTER TABLE "fiche_instances" ADD COLUMN     "clotureAdministrative" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clotureLe" TIMESTAMP(3),
ADD COLUMN     "motifCloture" TEXT;
