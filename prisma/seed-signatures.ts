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

const TAILLE_MAX_KO = 150;

async function main() {
  const dir = path.join(__dirname, "signatures");

  if (!fs.existsSync(dir)) {
    throw new Error(`Dossier introuvable : ${dir}`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith(".") && /\.(png|jpe?g)$/i.test(f));

  console.log(`${files.length} image(s) trouvée(s) dans prisma/signatures`);

  // Index nom de fichier (sans extension, en minuscules) -> fichier
  const fichierParUsername = new Map<string, string>();
  for (const f of files) {
    const cle = path.parse(f).name.trim().toLowerCase();
    if (fichierParUsername.has(cle)) {
      console.log(
        `!!  Doublon pour "${cle}" : ${fichierParUsername.get(cle)} et ${f} (${f} ignoré)`
      );
      continue;
    }
    fichierParUsername.set(cle, f);
  }

  // Tous les utilisateurs concernés
  const users = await prisma.user.findMany({
    where: { role: { in: ROLES_AVEC_SIGNATURE as any } },
    select: { id: true, username: true, role: true, signatureImage: true },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });

  console.log(`${users.length} utilisateur(s) avec un rôle à signature\n`);

  const usernamesTraites = new Set<string>();
  let ok = 0;
  let inchanges = 0;
  let sansImage = 0;

  for (const user of users) {
    const cle = user.username.trim().toLowerCase();
    const file = fichierParUsername.get(cle);

    if (!file) {
      sansImage++;
      console.log(
        `!!  ${user.username} (${user.role}) : pas d'image${
          user.signatureImage ? " (signature existante conservée)" : ""
        }`
      );
      continue;
    }

    const fullPath = path.join(dir, file);
    const buffer = fs.readFileSync(fullPath);
    const tailleKo = Math.round(buffer.length / 1024);

    if (tailleKo > TAILLE_MAX_KO) {
      console.log(
        `!!  ${file} pèse ${tailleKo} Ko (> ${TAILLE_MAX_KO} Ko) : pensez à la compresser`
      );
    }

    const ext = path.extname(file).slice(1).toLowerCase();
    const mime = ext === "jpg" ? "jpeg" : ext;
    const dataUrl = `data:image/${mime};base64,${buffer.toString("base64")}`;

    usernamesTraites.add(cle);

    if (user.signatureImage === dataUrl) {
      inchanges++;
      console.log(`=   ${user.username} (${user.role}) : déjà à jour`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { signatureImage: dataUrl },
    });

    ok++;
    console.log(`OK  ${user.username} (${user.role}) : ${file} (${tailleKo} Ko)`);
  }

  // Images sans utilisateur correspondant (faute de frappe dans le nom ?)
  const orphelines = [...fichierParUsername.entries()]
    .filter(([cle]) => !usernamesTraites.has(cle))
    .map(([, f]) => f);

  if (orphelines.length) {
    console.log(
      `\nImages sans utilisateur concerné (nom ou rôle incorrect ?) : ${orphelines.join(", ")}`
    );
  }

  console.log(
    `\nRésumé : ${ok} mise(s) à jour, ${inchanges} déjà à jour, ${sansImage} sans image, ${orphelines.length} image(s) orpheline(s)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());