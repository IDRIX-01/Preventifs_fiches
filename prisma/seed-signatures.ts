import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const ROLES_AVEC_SIGNATURE = [
  "CHEF_EQUIPE",
  "RESPONSABLE_PRODUCTION",
  "RESPONSABLE_MAINTENANCE",
  "DIRECTEUR_TECHNIQUE",
];

async function main() {
  const dir = path.join(__dirname, "signatures");
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));

  for (const file of files) {
    const username = path.parse(file).name;
    const ext = path.extname(file).slice(1).toLowerCase();
    const mime = ext === "jpg" ? "jpeg" : ext;
    const b64 = fs.readFileSync(path.join(dir, file)).toString("base64");

    const res = await prisma.user.updateMany({
      where: { username, role: { in: ROLES_AVEC_SIGNATURE } },
      data: { signatureImage: `data:image/${mime};base64,${b64}` },
    });
    console.log(
      res.count ? `OK  ${username}` : `??  ${username} : utilisateur introuvable ou rôle non concerné`
    );
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());