# QHSE Maintenance — Digitalisation des fiches d'entretien préventif

Application Next.js pour gérer vos fiches d'entretien (comme `FICHES.pdf` — fardeleuse Sidel) :
saisie par le machiniste, validation en cascade par le chef d'équipe et les responsables,
archivage et impression réservés à l'admin.

## 1. Installation locale

```bash
cd qhse-maintenance
npm install
cp .env.example .env          # puis générer NEXTAUTH_SECRET avec: openssl rand -base64 32
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Ouvrez http://localhost:3000 — comptes de test créés par le seed (mot de passe `ChangeMoi123!`,
**à changer immédiatement en production**) :

| Identifiant   | Rôle                     |
|---------------|--------------------------|
| admin         | ADMIN                    |
| machiniste1   | MACHINISTE               |
| chefequipe1   | CHEF_EQUIPE              |
| resp.prod     | RESPONSABLE_PRODUCTION   |
| resp.maint    | RESPONSABLE_MAINTENANCE  |
| directeur     | DIRECTEUR_TECHNIQUE      |

## 2. Comment ça répond à votre besoin

- **Bibliothèque de modèles** (`FicheTemplate`) : chaque type de fiche (EPI, consignes,
  actions, ressources) est une donnée JSON, pas du code. Pour ajouter un 6e, 10e type de
  fiche, on crée une nouvelle ligne — le format papier est reproduit à l'identique par
  `components/FicheView.tsx`, qui ne fait qu'afficher ces données.
- **Workflow séquentiel strict** (`lib/workflow.ts` + `app/api/fiches/[id]/route.ts`) :
  Machiniste → Chef d'équipe → Resp. Production → Resp. Maintenance → Directeur → Admin.
  À chaque étape, seul le rôle attendu peut modifier sa partie ; la vérification est faite
  **côté serveur** dans la route API, pas seulement cachée dans l'interface — donc infalsifiable.
- **Traçabilité** (`FicheSignature`) : chaque validation enregistre qui, quel rôle, à quelle
  date/heure — l'équivalent numérique de la signature papier.
- **Accès admin exclusif** (`middleware.ts`) : `/admin/*` est bloqué côté serveur pour tout
  rôle différent de ADMIN, avec redirection automatique. Aucun compte ne peut s'auto-attribuer
  ce rôle : les comptes sont créés uniquement par l'admin (pas d'auto-inscription, voir `lib/auth.ts`).
- **Impression/export réservés à l'admin** (`lib/workflow.ts:canPrint`, vérifié dans
  `app/api/fiches/[id]/print/route.ts`) : le bouton n'apparaît même pas dans l'UI pour les
  autres rôles, et l'API refuse la requête même si elle est appelée directement.

## 3. Ce qui est déjà fonctionnel

- Connexion par identifiant/mot de passe avec rôles
- Modèle de données complet (Prisma) avec le modèle Fardeleuse Sidel pré-chargé
- Workflow de validation étape par étape avec verrouillage serveur
- Affichage fidèle du format papier (EPI, consignes, actions à cocher, signatures)
- Tableau de bord filtré par rôle
- Protection stricte de l'espace admin

## 4. Ce qu'il reste à construire (prochaines étapes)

Ce scaffold pose l'architecture correcte, mais pour un usage en production il manque encore :

1. **Formulaire admin de création de fiche/OT** (actuellement possible via l'API `POST /api/fiches`
   ou Prisma Studio : `npm run prisma:studio`)
2. **Formulaire admin de création de modèle** (nouveau type de fiche, actuellement en JSON manuel)
3. **Gestion des utilisateurs côté UI** (création/désactivation de comptes — actuellement en base)
4. **Génération PDF réelle** avec `@react-pdf/renderer` (déjà en dépendance) reprenant le layout
   exact de `FicheView.tsx`, pour un export propre plutôt que l'impression navigateur
5. **Signature électronique dessinée** (canvas) si une signature manuscrite est nécessaire,
   en plus de la validation "nom + horodatage" déjà en place
6. **Déploiement** : Vercel (recommandé, gratuit pour démarrer) + une vraie base de données
   (Postgres — Supabase ou Neon ont un plan gratuit) en remplaçant `DATABASE_URL` et le
   `provider` dans `prisma/schema.prisma`

## 5. Déploiement rapide sur Vercel

```bash
git init && git add . && git commit -m "Initial commit"
# créer un repo GitHub, puis:
git push
# sur vercel.com : "Import Project", connecter le repo,
# ajouter les variables d'environnement (DATABASE_URL vers votre Postgres, NEXTAUTH_SECRET, NEXTAUTH_URL)
```
