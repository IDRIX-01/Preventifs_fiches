import { PrismaClient } from "@prisma/client";
import { Role } from "../lib/enums";
import { serializeTemplateFields } from "../lib/json-fields";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---------------------------------------------------------------------
  // Contenu commun des fiches génériques (EPI, consignes, actions, ressources)
  // ---------------------------------------------------------------------
  const epiCommun = [
    { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
    { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
    { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
    { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
    { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
    { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
    { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
    { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
    { code: "EPI-GANT-PVC", description: "GANT PVC", quantite: 1 },
    { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
    { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
  ];

  const consignesACommun = [
    "Port d'une paire de gant obligatoire",
    "Respect des mesures de sécurité mises en place",
    "Protection obligatoire des voies respiratoires",
    "Port du masque à usage unique obligatoire",
    "Port de la charlotte à usage unique obligatoire",
    "Port des surchaussures à usage unique obligatoire",
    "Protection obligatoire de la tête",
    "Respecter les cycles de nettoyage et de désinfection",
    "Respecter les règles d'habillement",
    "Maintenir la propreté des équipements mécaniques en contact avec les articles",
    "Avant de démarrer la machine, s'assurer que tous les objets étrangers (chiffons, outils, etc.) ont été retirés de la machine",
    "Utiliser obligatoirement tous les dispositifs de protection individuelle",
    "Il est strictement interdit d'entrer dans la machine pendant son fonctionnement en mode de production ou de nettoyage",
    "Avant de commencer toute opération sur la machine, arrêter la machine, éteindre et verrouiller les alimentations de la machine",
  ];

  const consignesNeCommun = [
    "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
    "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
    "Ne pas utiliser de solvants ni de brosses abrasives",
    "Ne pas fumer pendant l'intervention",
    "Ne pas boire pendant l'intervention",
    "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
    "Ne jamais utiliser d'acétone ou de produits dérivés",
    "Ne jamais effectuer de travaux de soudure électrique sur la machine",
    "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
    "Ne placez pas vos mains près d'une partie mobile de la machine",
    "N'effectuez aucun réglage lorsque la machine est en marche",
    "Ne pas mettre les mains près des surfaces chaudes du tunnel",
  ];

  const actionsCommunes = [
    { code: "ACT-00034", libelle: "NETTOYER L'INTERIEUR ET L'EXTERIEUR BATI CHAINE" },
    { code: "ACT-00035", libelle: "VERIFIER LE BON FONCTIONNEMENT DU CLIMATISEUR ARMOIRE ELECTRIQUE" },
    { code: "ACT-00036", libelle: "VERIFIER L'ALIGNEMENT ET LE SERRAGE DE TOUS LES CAPTEURS PHOTO-ELECTRIQUES" },
    { code: "ACT-00037", libelle: "VERIFIER L'ETAT DE PROPRETE DES TAPIS MODULAIRES" },
    { code: "ACT-00038", libelle: "VERIFIER LE NIVEAU DE LUBRIFIANT DE CONVOYEUR ENTREE MACHINE" },
    { code: "ACT-00039", libelle: "VERIFIER LA POSITION DE LIMITEUR DE COUPLE DE CYCLEUR D'ALIMENTATION" },
    { code: "ACT-00040", libelle: "VERIFIER L'ALIGNEMENT DE CHAINE DE CYCLEUR" },
    { code: "ACT-00041", libelle: "NETTOYER LES ROULEAUX DE DEBIT DE FILM" },
    { code: "ACT-00042", libelle: "VERIFIER L'ETAT ET LA QUALITE DE TABLE D'ASPIRATION" },
    { code: "ACT-00043", libelle: "VERIFIER L'ETAT DE PROPRETE ET L'ALIGNEMENT DE TAPIS DE NAPPAGE" },
    { code: "ACT-00044", libelle: "VERIFIER L'ETAT ET L'ALIGNEMENT DE CHAINE TUNNEL" },
    { code: "ACT-00045", libelle: "VERIFIER L'ETAT DE PROPRETE DES GRILLES D'EVACUATION D'AIR" },
    { code: "ACT-00046", libelle: "NETTOYER LA TABLE D'INJECTION (ROULEAUX, COUTEAU, ENCLUME)" },
    { code: "ACT-00047", libelle: "NETTOYER LES BARRES IONISANTES DE LA TABLE D'ALIMENTATION EN FILM" },
    { code: "ACT-00048", libelle: "VERIFIER LE NIVEAU DU RESERVOIR D'HUILE SYNTOCHAINE" },
  ];

  const ressourcesCommunes = [
    { code: "RS-MACH", description: "MACHINISTE", nombre: 1, heuresPlan: 8.0 },
  ];

  // ---------------------------------------------------------------------
  // SIDEL — une fiche MTC par machine
  // ---------------------------------------------------------------------
  type MachineSidel = {
    numero: string;
    machine: string;
    code: string;
    intervention: string;
    titreOverride?: string;
    epiOverride?: { code: string; description: string; quantite: number }[];
    actionsOverride?: { code: string; libelle: string }[];
    consignesAOverride?: string[];
    consignesNeOverride?: string[];
    ressourcesOverride?: { code: string; description: string; nombre: number; heuresPlan: number }[];
  };

  const machinesSidel: MachineSidel[] = [
    {
      numero: "011",
      machine: "FARDELEUSE",
      code: "SDL-FARD",
      intervention: "SDL-HBD-FARD",
    },
    {
      numero: "017",
      machine: "REMPLISSEUSE-HEUFT",
      code: "SDL-REMP-HEUFT",
      intervention: "SDL-HBD-REMP-HEUFT",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF HEUFT REMPLISSEUSE SIDEL",
      epiOverride: [], // aucun EPI listé sur la fiche source
      actionsOverride: [
        { code: "ACT-00532", libelle: "S'ASSURER DE L'HYGIENE DE LA MACHINE (ABSENCE DE POUSSIERE, GRAISSE, HUILE ET AUTRE ELEMENT SALISSANT)" },
        { code: "ACT-00534", libelle: "VERIFIER S'IL Y A PAS DE BRUIT ANORMAL SUR L'ENSEMBLE DE LA MACHINE" },
        { code: "ACT-00604", libelle: "ENLEVER LES DEBRIS DE VERRE ET LES CORPS ETRANGERS" },
        { code: "ACT-00605", libelle: "VERIFIER LE REGLAGE DE SORTE QUE LES RECIPIENTS APPROCHENT LE CENTRE DU 1er SEGMENT" },
        { code: "ACT-00606", libelle: "NETTOYER AVEC UN CHIFFON HUMIDE LE BATI SAUF LE TERMINAL DE COMMANDE" },
        { code: "ACT-00607", libelle: "VERIFIER L'USURE ET L'ATTACHE DES POINTS DE SEGMENTS" },
        { code: "ACT-00608", libelle: "CONTROLER LES FUITES D'AIR / EAU / HUILE" },
        { code: "ACT-00609", libelle: "NETTOYER AVEC UN CHIFFON MOU ET SEC LE TERMINAL DE COMMANDE" },
      ],
    },
    {
      numero: "021",
      machine: "REMPLISSEUSE",
      code: "SDL-REMP",
      intervention: "SDL-HBD-REMP",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF REMPLISSEUSE SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      actionsOverride: [
        { code: "ACT-00081", libelle: "CONTROLER L'ABSENCE DE BRUIT, ANOMALIE, JEU ET VIBRATION DANS LES COMPOSANTS DE LA MOTORISATION" },
        { code: "ACT-00082", libelle: "VERIFIER LA PRESSION D'ALIMENTATION DE L'AIR AUX DIFFERENTES FONCTIONS" },
        { code: "ACT-00083", libelle: "VIDER LA CONDENSATION EVENTUELLE ACCUMULEE SOUS LE FILTRE D'ECHAPPEMENT" },
        { code: "ACT-00084", libelle: "VERIFIER S'IL N'Y A PAS DE FUITE DE GRAISSE DES RACCORDS, DES TUYAUX ET DES CENTRALES DE DISTRIBUTION" },
        { code: "ACT-00085", libelle: "CONTROLER L'INTEGRITE DU SOUFFLET" },
        { code: "ACT-00086", libelle: "CONTROLER ET NETTOYER LE SPIRAL BUFFER" },
        { code: "ACT-00087", libelle: "VERIFIER LE FONCTIONNEMENT DU CLIMATISEUR DE L'ARMOIRE ELECTRIQUE" },
        { code: "AM-F0001", libelle: "NETTOYER LES COFFRETS TETES ET LES BROCHES DE FERMETURE AROL" },
        { code: "AM-F0002", libelle: "NETTOYER LES CAPTEURS" },
        { code: "AM-F0003", libelle: "NETTOYER LE CAPTEUR DE FAUSSE BOUTEILLE" },
        { code: "AM-F0004", libelle: "NETTOYER BATI ZONE BOUCHONNEUSE" },
        { code: "AM-F0005", libelle: "NETTOYER BATI" },
        { code: "AM-F0006", libelle: "CONTROLER LA PRESSION ENTREE ET PRESSION FILTRE" },
        { code: "AM-F0007", libelle: "CONTROLER LA COLONNE LUMINEUSE" },
        { code: "AM-F0008", libelle: "CONTROLER LA PRESSION AIR D'ALIMENTATION" },
        { code: "AM-F0009", libelle: "CONTROLER LES CONNEXIONS PNEUMATIQUES" },
        { code: "AM-F0010", libelle: "CONTROLER LES PICTOGRAMMES DE SECURITE" },
        { code: "AM-F0011", libelle: "CONTROLER LA CHUTE DES BOUTEILLES" },
        { code: "AM-F0012", libelle: "CONTROLER LES FUITES D'AIR" },
        { code: "AM-F0013", libelle: "GRAISSER LA CENTRALE TOURELLE AROL" },
        { code: "AM-F0014", libelle: "REMPLIR LE RESERVOIR DE GRAISSE NECESSAIRE" },
        { code: "AM-F0015", libelle: "NETTOYAGE ET DESINFECTION DES TETES DE BOUCHONNAGE" },
      ],
    },
    {
      numero: "119",
      machine: "ETIQUETEUSE",
      code: "SDL-ETIQ",
      intervention: "SDL-HBD-ETIQ",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF ETIQUETEUSEUSE SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
        "Ne pas laver le groupe d'étiquetage ROLLQUATTRO",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais entraîner la roue de soufflage en rotation en la tirant ou en la poussant",
        "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
        "N'effectuez aucun réglage lorsque la machine est en marche",
      ],
      ressourcesOverride: [{ code: "RS-MECA", description: "MECANIQUE", nombre: 1, heuresPlan: 1.0 }],
      actionsOverride: [
        { code: "ACT-00008", libelle: "NETTOYER ET VERIFIER LE PATIN, LES GALERIES VIDES INTERNES" },
        { code: "ACT-00009", libelle: "VERIFIER L'ETAT DE LA PLAQUE DE VIDE" },
        { code: "ACT-00010", libelle: "VERIFIER ET NETTOYER LA PLAQUE DU DISTRIBUTEUR DE VIDE" },
        { code: "ACT-00011", libelle: "VERIFIER ET NETTOYER LES TUYAUX ET CONDUITS DE RACCORDEMENT D'UNITE D'ETIQUETAGE" },
        { code: "ACT-00012", libelle: "VERIFIER LE FONCTIONNEMENT ROULEAUX GUIDAGE PAPIER DE SUPPORTS BOBINES" },
        { code: "ACT-00013", libelle: "NETTOYER LES FILTRES SYSTEME A VIDE, CONTROLER ET NETTOYER LE FILTRE VANNE DE SECURITE SYSTEME A VIDE" },
        { code: "ACT-00014", libelle: "CONTROLER LE CIRCUIT D'INSTALLATION PNEUMATIQUE" },
        { code: "ACT-00015", libelle: "CONTROLER LA FIXATION CONTRE-LAME ET BOULONS DE REGLAGE DE ROULEAU DE COUPE" },
        { code: "ACT-00016", libelle: "NETTOYER ET CONTROLER LES SELLETTES" },
        { code: "ACT-00017", libelle: "NETTOYER ET LUBRIFIER LA VIS DE REGLAGE CELLULE PHOTO-ELECTRIQUE LECTURE DU SPOT ET CAPTEUR HAUTEUR CONVOYEUR" },
        { code: "ACT-00018", libelle: "VERIFIER LE NETTOYAGE DU ROULEAU DE CONTRASTE" },
        { code: "ACT-00019", libelle: "NETTOYER ET VERIFIER LE ROULEAU D'ENTRAINEMENT" },
        { code: "ACT-00020", libelle: "NETTOYER ET CONTROLER L'USURE / JEUX SUPERFLUS DE DISPOSITIF D'ORIENTATION DU CONVOYEUR" },
        { code: "ACT-00023", libelle: "CONTROLER VISUELLEMENT LA MACHINE ( BRUIT ANORMAL , FUITE )" },
        { code: "ACT-00063", libelle: "LUBRIFIER LA CHAINE" },
        { code: "ACT-00283", libelle: "VERIFIER QU'IL N'Y A PAS FUITE D'EAU" },
        { code: "ACT-00385", libelle: "VERIFIER LES FUITES D'AIR" },
        { code: "ACT-00551", libelle: "LUBRIFIER L'ENGRENANGE PRINCIPAL" },
        { code: "ACT-00552", libelle: "LUBRIFIER COURROIE-MOTEUR BRUSHLESS" },
        { code: "ACT-00553", libelle: "CONTROLER LA COURROIE D'ENTRAINEMENT DE LA PLATEFORME" },
        { code: "ACT-00554", libelle: "CONTROLER L'ETAT DES TETES DE CENTRAGE" },
        { code: "ACT-00555", libelle: "CONTROLER L'ETAT D'USURE DES LAMES ( FIXE ET ROTATIVE )" },
        { code: "ACT-00556", libelle: "CONTROLER LES COLLECTEURS ( SOUFFLEUSE ET A VIDE )" },
        { code: "ACT-00557", libelle: "NETTOYER LES COQUES DE COUPE" },
        { code: "ACT-00558", libelle: "CONTROLER LE SYSTEME DE FREINAGE DES SUPPORTS BOBINES" },
        { code: "ACT-00559", libelle: "VERIFIER L'ETAT DES ENGRENAGES ET CHAINES" },
      ],
    },
    {
      numero: "136",
      machine: "CONVOYEUR",
      code: "SDL-CONV",
      intervention: "SDL-HBD-CONV",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF CONVOYEUR SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-CHIM", description: "GANT CHIMIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-GANT-SOUD", description: "GANT DE SOUDURE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
        "N'effectuez aucun réglage lorsque la machine est en marche",
      ],
      ressourcesOverride: [{ code: "RS-MECA", description: "MECANIQUE", nombre: 1, heuresPlan: 1.0 }],
      actionsOverride: [
        { code: "ACT-00637", libelle: "NETTOYER A SEC LES MOTO-REDUCTEURS" },
        { code: "ACT-00638", libelle: "NETTOYER LES CONVOYEURS ( CORPS ETRANGERS , RESIDUS , POUSSIERES )" },
        { code: "ACT-00639", libelle: "VERIFIER L'ETAT DES CONVOYEURS ( CHAINE , TAPIS , GALETS )" },
        { code: "ACT-00640", libelle: "VERIFIER L'ETAT DES PIECES D'USURE" },
        { code: "ACT-00641", libelle: "VERIFIER L'ETAT DES DRAPEAUX" },
        { code: "ACT-00642", libelle: "VERIFIER S'IL N'Y A PAS DE FUITE D'HUILE AU NIVEAU DES JOINTS A LEVRES DES REDUCTEURS" },
        { code: "ACT-00643", libelle: "DEBOUCHER LES BUSES DE LUBRIFICATION" },
        { code: "ACT-00644", libelle: "VERIFIER L'ETAT DES SEPARATEURS DE BOUTEILLES" },
        { code: "ACT-00645", libelle: "VERIFIER L'ETAT DES TAPIS" },
        { code: "ACT-00646", libelle: "CONTROLER LA PERTE D'HUILE MOTOREDUCTEURS" },
        { code: "ACT-00647", libelle: "VERIFIER L'ETAT DES ROULEMENTS ET DES PALIERS" },
      ],
    },
    {
      numero: "106",
      machine: "SOUFFLEUSE",
      code: "SDL-SOUF",
      intervention: "SDL-HBD-SOUF",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF SOUFFLEUSE SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-CHIM", description: "GANT CHIMIQUE", quantite: 1 },
        { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-GANT-SOUD", description: "GANT DE SOUDURE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais entraîner la roue de soufflage en rotation en la tirant ou en la poussant",
        "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
        "N'effectuez aucun réglage lorsque la machine est en marche",
      ],
      ressourcesOverride: [{ code: "RS-MECA", description: "MECANIQUE", nombre: 1, heuresPlan: 1.0 }],
      actionsOverride: [
        { code: "AM-B0001", libelle: "VIDER LES BACS DE RECUPERATION DES PREFORMES ET DES BOUTEILLES" },
        { code: "AM-B0002", libelle: "CONTROLER L'AUDITIF DE FUITE D'AIR POUR LA SOUFFLEUSE" },
        { code: "AM-B0003", libelle: "NETTOYER LE COUVERCLE DU FILTRE 40µM DE LA LIGNE 7B" },
        { code: "AM-B0004", libelle: "NETTOYER LA TABLE DE TRANSFERT ET LES ELEMENTS EN CONTACT AVEC L'ARTICLE (HORS POSTE D'ELONGATION)" },
        { code: "AM-B0005", libelle: "NETTOYER LES SURFACES DE CONTACT ENTRE LE MOULE ET LE NEZ DE TUYERE" },
        { code: "AM-B0007", libelle: "NETTOYER LES CAMES DE TRANSFERT PREFORMES ET BOUTEILLES" },
        { code: "AM-B0008", libelle: "NETTOYER LES FILTRES DES CIRCUITS HYDRAULIQUES" },
        { code: "AM-B0009", libelle: "CONTROLER L'ABSENCE DE FUITE D'EAU SUR LE CIRCUIT HYDRAULIQUE" },
        { code: "AM-B0010", libelle: "NETTOYER LES TIGES D'ELONGATION + CONTROLER LES VOIES D'AIMANTS" },
        { code: "AM-B0011", libelle: "NETTOYER LA CAME DE DEVERROUILLAGE MOULE" },
        { code: "AM-B0012", libelle: "NETTOYER ET CONTROLER LES MOULES DANS LA MACHINE" },
        { code: "AM-B0015", libelle: "NETTOYER LES DOIGTS DE VERROUILLAGE DES UNITES PORTE-MOULE" },
        { code: "AM-B0016", libelle: "CONTROLER L'ALLONGEMENT DE LA CHAINE DE TOURNETTE + TENSION DU RESSORT" },
        { code: "AM-B0018", libelle: "CONTROLER LA TENSION DE LA CHAINE FIXE DE ROTATION DES TOURNETTES" },
        { code: "AM-B0019", libelle: "CONTROLER LE FONCTIONNEMENT DE LA SECURITE DE PRESENCE DU SYSTEME DE ROTATION MANUELLE" },
        { code: "AM-B0020", libelle: "NETTOYER LE SYSTEME D'ASPIRATION DU DEPOUSSIERAGE ET DES FILTRES DE L'ASPIRATEUR" },
        { code: "AM-B0021", libelle: "CONTROLER AUDITIF DES FUITES D'AIR DE L'ALIMENTATEUR" },
        { code: "AM-B0022", libelle: "NETTOYER LES ELEMENTS EN CONTACT AVEC LA PREFORME DE L'ALIMENTATEUR (HORS BANDES TRANSPORTEUSES ET TREMIE)" },
        { code: "AM-B0023", libelle: "CONTROLER / NETTOYER L'ETAT DE LA BANDE TRANSPORTEUSE DE L'ALIMENTATEUR" },
        { code: "AM-B0024", libelle: "CONTROLER L'ETAT DE LA COURROIE DE TRANSMISSION DES ROULEAUX ORIENTEURS" },
        { code: "AM-B0025", libelle: "NETTOYER LA TREMIE ET LES SURFACES VITREE DE L'ALIMENTATEUR" },
        { code: "AM-B0026", libelle: "CONTROLER VISUELLEMENT LE MOTOREDUCTEUR" },
        { code: "AM-B0027", libelle: "CONTROLER LE FONCTIONNEMENT DE LA COLONNE DE SIGNALISATION" },
        { code: "AM-B0028", libelle: "NETTOYER LES CELLULES PHOTOELECTRIQUES DE LA SOUFFLEUSE" },
        { code: "AM-B0029", libelle: "NETTOYER LES CELLULES PHOTOELECTRIQUES DE L'ALIMENTATEUR" },
        { code: "AM-B0030", libelle: "NETTOYER LA (OU LES) CAMERA(S) INFRAROUGE(S)" },
        { code: "AM-B0034", libelle: "GRAISSER LES DOIGTS DE VERROUILLAGE DES UNITES PORTE-MOULE" },
        { code: "AM-B0038", libelle: "GRAISSER LES ENCOCHES SUPERIEURES DE LA ROUE FOUR ET DES FOURCHETTES" },
        { code: "AM-B0039", libelle: "REMPLIR LA RESERVE DE GRAISSE" },
        { code: "AM-B0045", libelle: "CONTROLER LES RESSORTS DES SUPPORTS FONDS DE MOULES" },
      ],
    },
    {
      numero: "009",
      machine: "SOUFFLEUSE-CHILLER",
      code: "SDL-SOUF-CHIL",
      intervention: "SDL-HBD-SOUF-CHILL",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF CHILLER SOUFFLEUSE SIDEL",
      epiOverride: [],
      consignesAOverride: [],
      consignesNeOverride: [],
      actionsOverride: [
        { code: "ACT-00529", libelle: "NETTOYER LE RADIATEUR" },
        { code: "ACT-00530", libelle: "NETTOYER LE FILTRE RETOUR" },
        { code: "ACT-00531", libelle: "CONTROLER LA POMPE (BRUIT)" },
        { code: "ACT-00532", libelle: "S'ASSURER DE L'HYGIENE DE LA MACHINE (ABSENCE DE POUSSIERE, GRAISSE, HUILE ET AUTRE ELEMENT SALISSANT)" },
        { code: "ACT-00533", libelle: "CONTROLER LES FUITE D'AIR / EAU / HUILE" },
        { code: "ACT-00534", libelle: "VERIFIER S'IL Y A PAS DE BRUIT ANORMAL SUR L'ENSEMBLE DE LA MACHINE" },
      ],
    },
    {
      numero: "124",
      machine: "BOUCHONNEUSE",
      code: "SDL-REMP-BOU",
      intervention: "SDL-HBD-REMP-BOU",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF BOUCHONNEUSE SIDEL",
      epiOverride: [],
      consignesAOverride: [],
      consignesNeOverride: [],
      actionsOverride: [
        { code: "ACT-00023", libelle: "CONTROLER VISUELLEMENT LA MACHINE ( BRUIT ANORMAL , FUITE )" },
        { code: "ACT-00084", libelle: "VERIFIER S'IL N'Y A PAS DE FUITE DE GRAISSE DES RACCORDS, DES TUYAUX ET DES CENTRALES DE DISTRIBUTION" },
        { code: "ACT-00532", libelle: "S'ASSURER DE L'HYGIENE DE LA MACHINE (ABSENCE DE POUSSIERE, GRAISSE, HUILE ET AUTRE ELEMENT SALISSANT)" },
        { code: "ACT-00533", libelle: "CONTROLER LES FUITE D'AIR / EAU / HUILE" },
        { code: "ACT-00648", libelle: "CONTROLER LE DEGRE D'ENGORGEMENT DU FILTRE ( REMPLACER SI NECESSAIRE )" },
        { code: "ACT-00649", libelle: "VIDANGER LA CONDENSATION EVENTUELLE ACCUMULEE SOUS LE FILTRE D'ECHAPPEMENT" },
        { code: "ACT-00650", libelle: "CONTROLER, A L'AIDE DES MANOMETRES, QUE LES REDUCTEURS DE PRESSION SOIENT REGLES A LA PRESSION DE SERV" },
        { code: "ACT-00651", libelle: "CONTROLER QU'IL N'Y AIT PAS DEFUITES DE GRAISSE CENTRALE DE DISTRIBUTION" },
        { code: "ACT-00652", libelle: "VERIFIER LA PRESSION D'ALIMENTATION DE L'AIR AUX DIFFERENTES FONCTIONS" },
      ],
    },
    {
      numero: "005",
      machine: "CAP-FEEDER",
      code: "SDL-REMP-BOU-CAP",
      intervention: "SDL-HBD-REMP-BOU-CAP",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF CAP FEEDER DE LA REMPLISSEUSE SIDEL",
      epiOverride: [],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
        "Ne pas laver le groupe d'étiquetage ROLLQUATTRO",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais entraîner la roue de soufflage en rotation en la tirant ou en la poussant",
        "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
        "N'effectuez aucun réglage lorsque la machine est en marche",
        "Ne pas mettre les mains près des surfaces chaudes du tunnel",
      ],
      actionsOverride: [
        { code: "ACT-00072", libelle: "VERIFIER LE FONCTIONNEMENT DES BOUTONS D'URGENCE" },
        { code: "ACT-00532", libelle: "S'ASSURER DE L'HYGIENE DE LA MACHINE (ABSENCE DE POUSSIERE, GRAISSE, HUILE ET AUTRE ELEMENT SALISSANT)" },
        { code: "ACT-00534", libelle: "VERIFIER S'IL Y A PAS DE BRUIT ANORMAL SUR L'ENSEMBLE DE LA MACHINE" },
        { code: "ACT-00608", libelle: "CONTROLER LES FUITES D'AIR / EAU / HUILE" },
        { code: "ACT-00610", libelle: "VERIFIER LE TIROIR EN DESSOUS DE LA TREMIE" },
        { code: "ACT-00611", libelle: "NETTOYER LES FILTRES" },
        { code: "AM-F0007", libelle: "CONTROLER LA COLONNE LUMINEUSE" },
      ],
    },
    {
      numero: "143",
      machine: "ROBOPAK",
      code: "SDL-ROBO",
      intervention: "SDL-HEBD-ROBO",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF ROBOPAK SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
        "N'effectuez aucun réglage lorsque la machine est en marche",
      ],
      actionsOverride: [
        { code: "ACT-00065", libelle: "NETTOYER L'EXTERIEUR ET L'INTERIEUR BATI MACHINE" },
        { code: "ACT-00066", libelle: "NETTOYER LES CELLULES PHOTO-ELECTRIQUES" },
        { code: "ACT-00067", libelle: "NETTOYER LA CHAINE DE TRANSMISSION" },
        { code: "ACT-00068", libelle: "NETTOYER LES GUIDES EN POLYZENE" },
        { code: "ACT-00069", libelle: "NETTOYER LE FILTRE A AIR ET DECHARER LA CONDENSATION" },
        { code: "ACT-00070", libelle: "NETTOYER LA COURRONE DE ROTATION BRAS ET GRAISSER SI NECESSAIRE" },
        { code: "ACT-00071", libelle: "VERIFIER L'ETAT DE FIXATION DES CHEMINS DE CABLE DE LA PARTIE ROTATIVE" },
        { code: "ACT-00072", libelle: "VERIFIER LE FONCTIONNEMENT DES BOUTONS D'URGENCE" },
        { code: "ACT-00073", libelle: "VERIFIER LA FIN DE COURSE A ROULETTE" },
        { code: "ACT-00074", libelle: "CONTROLER L'ETAT D'USURE DES PIGNONS ET ROULEAUX" },
        { code: "ACT-00075", libelle: "CONTROLER L'ETAT DES ROUES DE CHARIOT DE PRE-ETIRAGE" },
        { code: "ACT-00076", libelle: "CONTROLER L'ETAT DE LA COURROIE DE CHARIOT DE PRE-ETIRAGE" },
        { code: "ACT-00077", libelle: "CONTROLER LA SOUDEUSE" },
        { code: "ACT-00078", libelle: "NETTOYER LE FIL DE COUPE" },
        { code: "ACT-00079", libelle: "GRAISSER ET CONTROLER LES ROUES DENTEES DE PINCE A RESSORT DE COUPE" },
        { code: "ACT-00080", libelle: "NETTOYER ET GRAISSER LES GUIDES DE COULISSEMENT" },
      ],
    },
    {
      numero: "105",
      machine: "SECHEUR",
      code: "SDL-SECH",
      intervention: "SDL-HBD-SECH",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF SECHEUR SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
        "Ne pas laver le groupe d'étiquetage ROLLQUATTRO",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
      ],
      ressourcesOverride: [{ code: "RS-MECA", description: "MECANIQUE", nombre: 1, heuresPlan: 1.0 }],
      actionsOverride: [
        { code: "ACT-00612", libelle: "CONTROLER VISUELLEMENT LES BUSES" },
        { code: "ACT-00613", libelle: "CONTROLER LA DISTRIBUTION D'AIR" },
        { code: "ACT-00614", libelle: "CONTROLER LE BRUIT DE FONCTIONNEMENT DE LA TURBINE" },
        { code: "ACT-00615", libelle: "NETTOYER L'INTERIEUR ET L'EXTERIEUR DU SECHEUR" },
        { code: "ACT-00616", libelle: "NETTOYER LES BUSES" },
        { code: "ACT-00617", libelle: "NETTOYER L'INTERIEUR DES BUSES" },
        { code: "ACT-00618", libelle: "NETTOYER L'EAU ET LA SALETE AU NIVEAU DE LA COLLECTE D'EAU" },
        { code: "ACT-00619", libelle: "NETTOYER LES ENTREES D'AIR DE LA MACHINE" },
        { code: "ACT-00620", libelle: "CONTROLER L'ETAT DES FILTRES D'ASPIRATION" },
      ],
    },
    {
      numero: "017-ETIQ",
      machine: "HEUFT-ETIQUETEUSE",
      code: "SDL-ETIQ-HEUFT",
      intervention: "SDL-ETIQ-HEUFT",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF HEUFT DE L'ETIQUETEUSE SIDEL",
      epiOverride: [],
      consignesAOverride: [],
      consignesNeOverride: [],
      actionsOverride: [
        { code: "ACT-00532", libelle: "S'ASSURER DE L'HYGIENE DE LA MACHINE (ABSENCE DE POUSSIERE, GRAISSE, HUILE ET AUTRE ELEMENT SALISSANT)" },
        { code: "ACT-00533", libelle: "CONTROLER LES FUITE D'AIR / EAU / HUILE" },
        { code: "ACT-00534", libelle: "VERIFIER S'IL Y A PAS DE BRUIT ANORMAL SUR L'ENSEMBLE DE LA MACHINE" },
        { code: "ACT-00606", libelle: "NETTOYER AVEC UN CHIFFON HUMIDE LE BATI SAUF LE TERMINAL DE COMMANDE" },
        { code: "ACT-00609", libelle: "NETTOYER AVEC UN CHIFFON MOU ET SEC LE TERMINAL DE COMMANDE" },
        { code: "ACT-00653", libelle: "VERIFIER LA SOUPLESSE" },
        { code: "ACT-00654", libelle: "NETTOYER LES DEBRIS DE VERRES ET LES CORPS ETRANGERS" },
        { code: "ACT-00655", libelle: "VERIFIER LE CENTRAGE DES RECIPIENTS AU NIVEAU DU 1ER SEGMENT" },
      ],
    },
    {
      numero: "017-SLEE",
      machine: "HEUFT-SLEEVEUSE",
      code: "SDL-SLEE-HEUFT",
      intervention: "SDL-HBD-SLEE-HEUFT",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF HEUFT DE LA SLEEVEUSE SIDEL",
      epiOverride: [],
      consignesAOverride: [],
      consignesNeOverride: [],
      actionsOverride: [
        { code: "ACT-00532", libelle: "S'ASSURER DE L'HYGIENE DE LA MACHINE (ABSENCE DE POUSSIERE, GRAISSE, HUILE ET AUTRE ELEMENT SALISSANT)" },
        { code: "ACT-00533", libelle: "CONTROLER LES FUITE D'AIR / EAU / HUILE" },
        { code: "ACT-00534", libelle: "VERIFIER S'IL Y A PAS DE BRUIT ANORMAL SUR L'ENSEMBLE DE LA MACHINE" },
        { code: "ACT-00606", libelle: "NETTOYER AVEC UN CHIFFON HUMIDE LE BATI SAUF LE TERMINAL DE COMMANDE" },
        { code: "ACT-00609", libelle: "NETTOYER AVEC UN CHIFFON MOU ET SEC LE TERMINAL DE COMMANDE" },
        { code: "ACT-00653", libelle: "VERIFIER LA SOUPLESSE" },
        { code: "ACT-00654", libelle: "NETTOYER LES DEBRIS DE VERRES ET LES CORPS ETRANGERS" },
        { code: "ACT-00655", libelle: "VERIFIER LE CENTRAGE DES RECIPIENTS AU NIVEAU DU 1ER SEGMENT" },
        { code: "ACT-00657", libelle: "VERIFIER L'USURE ET L'ATTACHE DES POINTS DE SEGMENTS" },
      ],
    },
    {
      numero: "118",
      machine: "SLEEVEUSE",
      code: "SDL-SLEE",
      intervention: "SDL-HEBD-SLEE",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF SLEEVEUSE SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      actionsOverride: [
        { code: "ACT-00022", libelle: "NETTOYER L'EXTERIEUR BATI ET CARROUSEL" },
        { code: "ACT-00023", libelle: "CONTROLER VISUELLEMENT LA MACHINE ( BRUIT ANORMAL , FUITE )" },
        { code: "ACT-00024", libelle: "RETIRER TOUS LES MANCHONS" },
        { code: "ACT-00025", libelle: "NETTOYER LA POUSSIERE DE LA MACHINE" },
        { code: "ACT-00026", libelle: "CONTRÔLER LES MANCHONS COINCES ENTRE LA COURROIE ET GUIDES MANDRINS" },
        { code: "ACT-00027", libelle: "RETIRER LES MANCHONS FONDUS DANS LE TUNNEL" },
        { code: "ACT-00028", libelle: "COUPER DES MANCHONS A GRANDE VITESSE POUR VERIFIER LA COUPE" },
        { code: "ACT-00029", libelle: "VERIFIER L'USURE DES PIONS POUSSOIRS ET AJUSTEMENT DE LA PRESSION SI NECESSAIRE" },
        { code: "ACT-00030", libelle: "VERIFIER L'USURE DE ROULEAU EN CAOUTCHOUC DU DEROULEUR" },
        { code: "ACT-00031", libelle: "VERIFIER L'USURE DE ROULEAU EN PLASTIQUE DE BLOC DE COUPE" },
        { code: "ACT-00032", libelle: "CONTROLER VISUELLEMENT TOUTES LES COURROIES" },
        { code: "ACT-00033", libelle: "VERIFIER LE BON FONCTIONNEMENT DU CLIMATISEUR DE L'ARMOIRE ELECTRIQUE" },
        { code: "AM-F0016", libelle: "GRAISSAGE DES ENGRENAGES DU BLOC DE COUPE" },
        { code: "AM-F0017", libelle: "CONTROLER LA QUALITE ET LE SERRAGE DES VIS SUPPORT MANDRINS" },
        { code: "AM-F0018", libelle: "VERIFICATION ET NETTOYAGE DE VIS SANS FIN" },
      ],
    },
    {
      numero: "098",
      machine: "PALETTISEUSE",
      code: "SDL-PALE",
      intervention: "SDL-HEBD-PALE",
      titreOverride: "FICHE D'ENTRETIEN PREVENTIF PALETTISEUSE SIDEL",
      epiOverride: [
        { code: "EPI-BOUCHON-OREI", description: "BOUCHON D'OREILLE", quantite: 1 },
        { code: "EPI-CAHCHE-NEZ", description: "MASQUE A POUSSIERE", quantite: 1 },
        { code: "EPI-CASQUE", description: "CASQUE DE SECURITE", quantite: 1 },
        { code: "EPI-CASQUE-ANTI", description: "CASQUE ANTI BRUIT", quantite: 1 },
        { code: "EPI-CHAUSSURE", description: "CHAUSSURE DE SECURITE", quantite: 1 },
        { code: "EPI-GANT-ISO", description: "GANT ISOLANT ELECTRIQUE", quantite: 1 },
        { code: "EPI-GANT-LAT", description: "GANT LATEX", quantite: 1 },
        { code: "EPI-GANT-MECA", description: "GANT MECANIQUE", quantite: 1 },
        { code: "EPI-LUNETTE-SEC", description: "LUNETTE DE SECURITE", quantite: 1 },
        { code: "EPI-TENUE", description: "TENUE DE SECURITE", quantite: 1 },
      ],
      consignesNeOverride: [
        "Ne pas utiliser de jet d'eau sous pression pour nettoyer la machine",
        "Ne pas vaporiser de l'eau chaude (température max. 45°C) sur les protections",
        "Ne pas utiliser de solvants ni de brosses abrasives",
        "Ne pas fumer pendant l'intervention",
        "Ne pas boire pendant l'intervention",
        "Ne jamais intervenir sur la machine lors d'un \"test des électrovannes fixes ou mobiles\" : portes ouvertes, la machine est en énergie (eau, air, électricité, etc.)",
        "Ne jamais utiliser d'acétone ou de produits dérivés",
        "Ne jamais effectuer de travaux de soudure électrique sur la machine",
        "Ne jamais remettre dans le circuit de production des articles tombés, manipulés ou éjectés par la machine",
        "Ne placez pas vos mains près d'une partie mobile de la machine",
        "N'effectuez aucun réglage lorsque la machine est en marche",
      ],
      actionsOverride: [
        { code: "ACT-00049", libelle: "NETTOYER L'EXTERIEUR ET L'INTERIEUR BATI MACHINE" },
        { code: "ACT-00050", libelle: "VERIFIER L'ALIGNEMENT ET LE SERRAGE DE TOUS LES CAPTEURS PHOTO-ELECTRIQUE" },
        { code: "ACT-00051", libelle: "VERIFIER LA TENSION ET L'ETAT DES COURROIES" },
        { code: "ACT-00052", libelle: "NETTOYER LES CONVOYEURS MACHINE" },
        { code: "ACT-00053", libelle: "NETTOYER TOUS LES CAPTEURS" },
        { code: "ACT-00054", libelle: "NETTOYER LES GLISSIERES DE POUSSEUR ET D'ASCENSEUR" },
        { code: "ACT-00055", libelle: "NETTOYER LES TIGES DES CENTREURS PACK" },
        { code: "ACT-00056", libelle: "NETTOYER LES AXES DE ROBOT ET DES GRIPPERS" },
        { code: "ACT-00057", libelle: "NETTOYER HMI MACHINE ET PANEL DU ROBOT" },
        { code: "ACT-00058", libelle: "NETTOYER LES VERINS ET DES AXES DU VERIN" },
        { code: "ACT-00059", libelle: "NETTOYER LES SILENCIEUX PNEUMATIQUES" },
        { code: "ACT-00060", libelle: "NETTOYER LES RESIDUS DE GRAISSE" },
        { code: "ACT-00061", libelle: "LUBRIFIER LES POINTS DE GRAISSAGE MANUEL" },
        { code: "ACT-00062", libelle: "NETTOYER LA CHAINE" },
        { code: "ACT-00063", libelle: "LUBRIFIER LA CHAINE" },
        { code: "ACT-00064", libelle: "VERIFIER LE NIVEAU DE GRAISSE DANS LE RESERVOIR DE POMPE A GRAISSE AUTOMATIQUE" },
      ],
    },
  ];

  const sidelTemplateByMachine: Record<string, string> = {};

  for (const m of machinesSidel) {
    const template = await prisma.ficheTemplate.upsert({
      where: { ref: `MTC.EN:${m.numero}` },
      update: {},
      create: serializeTemplateFields({
        ref: `MTC.EN:${m.numero}`,
        titre: m.titreOverride ?? `FICHE D'ENTRETIEN PREVENTIF ${m.machine} SIDEL`,
        version: "02",
        equipement: m.code,
        systeme: "SIDEL",
        intervention: m.intervention,
        epi: m.epiOverride ?? epiCommun,
        consignesA: m.consignesAOverride ?? consignesACommun,
        consignesNe: m.consignesNeOverride ?? consignesNeCommun,
        actions: m.actionsOverride ?? actionsCommunes,
        ressources: m.ressourcesOverride ?? ressourcesCommunes,
      }),
    });
    sidelTemplateByMachine[m.machine] = template.id;
  }

  function dedupByCode<T extends { code: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (!seen.has(item.code)) {
        seen.add(item.code);
        result.push(item);
      }
    }
    return result;
  }

  // ---------------------------------------------------------------------
  // Autres systèmes — une fiche générique chacun pour l'instant
  // ---------------------------------------------------------------------
  const autresSystemes = [
    { systeme: "ERTURK1", numero: "030" },
    { systeme: "ERTURK2", numero: "031" },
    { systeme: "SIPA", numero: "032" },
    { systeme: "05LITRES", numero: "033" },
    { systeme: "17LITRES", numero: "034" },
    { systeme: "BETAPAK1", numero: "035" },
    { systeme: "BETAPAK2", numero: "036" },
    { systeme: "BETAPAK3", numero: "037" },
    { systeme: "BETAPAK4", numero: "038" },
    { systeme: "BETAPAK5", numero: "039" },
  ];

  for (const s of autresSystemes) {
    await prisma.ficheTemplate.upsert({
      where: { ref: `MTC.EN:${s.numero}` },
      update: {},
      create: serializeTemplateFields({
        ref: `MTC.EN:${s.numero}`,
        titre: `FICHE D'ENTRETIEN PREVENTIF FARDELEUSE ${s.systeme}`,
        version: "02",
        equipement: `${s.systeme}-FARD`,
        systeme: s.systeme,
        intervention: `${s.systeme}-HEBD-FARD`,
        epi: epiCommun,
        consignesA: consignesACommun,
        consignesNe: consignesNeCommun,
        actions: actionsCommunes,
        ressources: ressourcesCommunes,
      }),
    });
  }

  // ---------------------------------------------------------------------
  // Machinistes importés depuis l'export Coswin (ressource RS-MACH).
  // Accès total : tous les machinistes voient toutes les fiches désormais
  // (assignedTemplateIds vide = pas de restriction, voir dashboard).
  // Inclut aussi le code 6350 (RS-INFO dans l'export, ajouté manuellement
  // sur demande) et 2245 (auparavant chef d'équipe, repassé machiniste).
  // ---------------------------------------------------------------------
  const employesRSMACH: { code: string; nom: string }[] = [
    { code: "6", nom: "OPOUE HONORAT" },
    { code: "20", nom: "FALLE SYLVANUS" },
    { code: "28", nom: "BROU ACHEDO STEPHANE" },
    { code: "31", nom: "GOZE LAGO JULIEN" },
    { code: "81", nom: "YAPO ROMEO" },
    { code: "1010", nom: "CISSE SIDIKI" },
    { code: "1013", nom: "KASSI EBY LUCIEN" },
    { code: "1015", nom: "ANOH KANGA JULIEN" },
    { code: "1028", nom: "OUMAROU MAMADOU MOCTAR" },
    { code: "1029", nom: "YAPO SEKA ARISTIDE" },
    { code: "1039", nom: "ELLOH KOUAME ALAIN" },
    { code: "1041", nom: "ZONGO ISSAKA" },
    { code: "1089", nom: "AMON AYEMOU PAUL" },
    { code: "1131", nom: "DINGUI AHOULOU VINCENT" },
    { code: "1176", nom: "KADJO ARTHUR" },
    { code: "2116", nom: "MIESSAN MAMAN SOPHIE" },
    { code: "2245", nom: "SOULEYMANE BAMBA" },
    { code: "2408", nom: "AMICHIA BILE" },
    { code: "2409", nom: "KOUADIO JEAN MARC" },
    { code: "2441", nom: "KADJO KODIA JEAN" },
    { code: "2509", nom: "MOYE SEKA JOEL HARMAND" },
    { code: "2570", nom: "BOUSSOU KADJA HERVE" },
    { code: "2741", nom: "KOUCOUA ALLEY EVARISTE" },
    { code: "2844", nom: "TOURE SEKOU" },
    { code: "2864", nom: "MAHE GUEABLE LANDRY" },
    { code: "2972", nom: "WOGNIN ATCHOHO JEAN B" },
    { code: "2985", nom: "KOUASSI ASHER KABLAN HERMANN" },
    { code: "3009", nom: "LOHOURY CHARLES" },
    { code: "3070", nom: "TOVI HUGUES LANDRY" },
    { code: "3107", nom: "GOUAN BLEMOU YVES CONST" },
    { code: "3169", nom: "AKUI PARFAIT ELIRONE BLA" },
    { code: "3187", nom: "KOUAMELAN AYEMOU YANNICK" },
    { code: "3205", nom: "YAO GNAGOH JOSEPH" },
    { code: "3242", nom: "BIO DESIRE PACOME" },
    { code: "3247", nom: "ZON ARNAUD" },
    { code: "3388", nom: "ADJE AHOBA ARNAUD HERMAN" },
    { code: "3408", nom: "N'CHO APOHI" },
    { code: "3415", nom: "KOUAME JORESTE NICODEME" },
    { code: "3445", nom: "ISSOUF TRAORE" },
    { code: "3881", nom: "N'GUESSAN NEUBA ELYSEE" },
    { code: "3883", nom: "ANOUGBRE KOUAKOU" },
    { code: "3884", nom: "KOHI DIMITRI ARNOLD" },
    { code: "3895", nom: "MOBIO JEAN MARIE" },
    { code: "3938", nom: "BEHINZI KOUAKOU JEAN DESIRE" },
    { code: "3945", nom: "YOUAN BI DANE CHARLES TA" },
    { code: "3949", nom: "KOUASSI YAO WILFRED" },
    { code: "3954", nom: "KOUASSI AFFRO JUDICAEL" },
    { code: "3963", nom: "AHOURE ADJOBI ARMAND" },
    { code: "4002", nom: "AMANI N'GUESSAN J. RICHARD" },
    { code: "4053", nom: "KONE FABRICE FOU RIER" },
    { code: "4064", nom: "KOUAME KOUACOU CAMILLE BAUDEL" },
    { code: "4076", nom: "TOVI NIAMKEY JUNIOR" },
    { code: "4078", nom: "KOUADIO KOUAME FELIX" },
    { code: "4109", nom: "ALLATIN ASSI BENJAMIN" },
    { code: "4126", nom: "DIALLO PATHE MOHAMED" },
    { code: "4174", nom: "KOUAME HOTAYEK OIDRINE" },
    { code: "4195", nom: "KASSI AFFIAN ANICET" },
    { code: "4200", nom: "KOUAME KOFFI GUY" },
    { code: "4235", nom: "TANOH BILE LEONCE ROLAND" },
    { code: "4251", nom: "N'DOLI KABLAN JUSTIN ALB" },
    { code: "4345", nom: "KOFFI YAO BERTIN" },
    { code: "4374", nom: "ZEOUEI BI TA MARUIS" },
    { code: "4409", nom: "KOUA N'GUESSAN EVRA MARIUS" },
    { code: "4410", nom: "ABO HIPPOLYTE" },
    { code: "4466", nom: "MEL MELEDJE PIERRE BEBEL" },
    { code: "4470", nom: "ANOH N'GATTA FREDERIC" },
    { code: "4488", nom: "ZIO MANGA ALAIN" },
    { code: "4497", nom: "MIEZAN YAO LANDRY" },
    { code: "4500", nom: "ANGORAN N'GOH GUY ALAIN" },
    { code: "4502", nom: "KOUAKOU KOUAME KEVIN" },
    { code: "4559", nom: "GATTA BI SAHUE JUNIOR" },
    { code: "4574", nom: "KASSI MAXIME BONAVENTURE" },
    { code: "4587", nom: "ZEGBAYOU SERI SERGE PACOME" },
    { code: "4629", nom: "ATTOUNGBRE KOUASSI BAH.A" },
    { code: "4640", nom: "GANDON CHRIST JUNEL" },
    { code: "4663", nom: "IPOU YAO BERANGER" },
    { code: "4694", nom: "ZIAO DJAKARIDJA" },
    { code: "4704", nom: "ABIA ABIA INNOCENT" },
    { code: "4711", nom: "KOUAME KAN EHOUA F" },
    { code: "4726", nom: "KOUAME KAN EBEN-EZER" },
    { code: "4728", nom: "OUATTARA ATTA NAOKI" },
    { code: "4739", nom: "TA BI BOLI ISIDORE" },
    { code: "4748", nom: "N'GUESSAN EDDY" },
    { code: "4750", nom: "BROU AMONKOU STEPHANE" },
    { code: "4781", nom: "YAO KOUAME GILBERT" },
    { code: "4802", nom: "YAO GIOVANNI JEAN BAPTISTE" },
    { code: "4822", nom: "WOSSOMAN KAKOU FABRICE" },
    { code: "4907", nom: "ALLOUAN OTCHOUMOU ALFRED" },
    { code: "4920", nom: "ALLOUAN ALLO CEDRIC" },
    { code: "4934", nom: "ANOH OTCHOUMOU ROGER" },
    { code: "4952", nom: "BROU ASSI PASCAL JOCELYN" },
    { code: "4966", nom: "AMON AMON MICHAEL PIERRE CL" },
    { code: "4971", nom: "AYEMOU KISSI DENIS" },
    { code: "4994", nom: "ANGODJI JEAN LUC SERGE" },
    { code: "5026", nom: "GBEGBE RICHARD" },
    { code: "5109", nom: "ETTIEN KOUA PASCAL" },
    { code: "5128", nom: "AGRE GOA CLAUDE NICAISE" },
    { code: "5241", nom: "DOUMBIA ISMAEL" },
    { code: "5249", nom: "KANGAH ASSEMAN ROYMOND" },
    { code: "5250", nom: "GILBERMAIN AHOURE MARTIN LORIEL" },
    { code: "5255", nom: "GAH MENAMOND GUY RICH" },
    { code: "5263", nom: "AHOURE GUY YANNICK" },
    { code: "5284", nom: "TOKO KODJO DENIS" },
    { code: "5302", nom: "AMANGOUA AHIMIN GHISLAIN" },
    { code: "5326", nom: "KAKOUHOTE YANNICK" },
    { code: "5351", nom: "AGBO SERGE PAMPHILE" },
    { code: "5360", nom: "KOUAKOU KONAN AIME" },
    { code: "5432", nom: "GNABELY FRANCK MATHIEU" },
    { code: "5506", nom: "N'GORAN KOFFI ARISTIDE" },
    { code: "5557", nom: "KOFFI YAO DE-PAUL LEMBERT" },
    { code: "5559", nom: "KOUADIO KOUASSI BERTRAND" },
    { code: "5561", nom: "DIBY N'DA KOFFI RODOLPHE" },
    { code: "5564", nom: "TANOH KONAN BRICE LAURENT" },
    { code: "5646", nom: "SEBE PRINCE EFFEL" },
    { code: "5664", nom: "ANANI KOBENAN FRY" },
    { code: "5701", nom: "KOUAME KAN GUY MARCEL" },
    { code: "5702", nom: "AMIN ASSI SERGE LANDRY" },
    { code: "5731", nom: "YAO KOUADIO BAH NOEL" },
    { code: "5735", nom: "BOUA BENJAMIN MARC ULRICH" },
    { code: "5767", nom: "KOKOU YIWO ELODIE DEBORAH" },
    { code: "5951", nom: "YAO KOUASSI RAOUL CARDIN" },
    { code: "5960", nom: "YAPI AKE JEAN-HUBERT" },
    { code: "6099", nom: "ANOH KOUAME AIME" },
    { code: "6112", nom: "KOUAME FRANCK" },
    { code: "6114", nom: "OFFA KOFFI DATE ERIC" },
    { code: "6123", nom: "KISSI BOZOMA NINA" },
    { code: "6160", nom: "KONAN JEAN-HUGUES" },
    { code: "6171", nom: "KEITA MAWA" },
    { code: "6221", nom: "BOUE YAO JEAN BOSCO" },
    { code: "6225", nom: "ALEKE MAWULI KOFFI" },
    { code: "6228", nom: "BOUE YAO JEAN BOSCO" },
    { code: "6244", nom: "SANOGO AKIM" },
    { code: "6270", nom: "ADON FABRICE" },
    { code: "6271", nom: "GOGBE" },
    { code: "6296", nom: "ANIBE" },
    { code: "6314", nom: "COULIBALY KYA JEAN ARNAUD" },
    { code: "6350", nom: "KONE SIE DRISSA" },
    { code: "6406", nom: "AOULOU" },
    { code: "6561", nom: "NOBA KOUA GEORGES ROSIN" },
    { code: "6587", nom: "ZOUBA AICHATOU" },
    { code: "6602", nom: "BAMBA" },
    { code: "6700", nom: "ANANI KOBENAN FELY" },
    { code: "6805", nom: "YAO KONAN" },
    { code: "6827", nom: "YOBOU ELYSEE" },
  ];

  // Ces codes sont classés RS-MACH dans Coswin mais sont en réalité des
  // chefs d'équipe dans l'organisation réelle — on les exclut des
  // machinistes importés et on les ajoute en CHEF_EQUIPE à la place.
  // NB : "2245" a été retiré de cette liste — le commentaire ci-dessus
  // indique explicitement qu'il est "repassé machiniste", donc il ne doit
  // pas être classé CHEF_EQUIPE.
  const codesChefsEquipe = new Set([
    "6",
    "20",
    "28",
    "31",
    "81",
    "1010",
    "1013",
    "1015",
    "1028",
    "1029",
    "1039",
    "1041",
    "1089",
    "1131",
    "1176",
    "2116",
    "2844",
    "2985",
  ]);

  const machinistesImportes = employesRSMACH
    .filter((e) => !codesChefsEquipe.has(e.code))
    .map((e) => ({
      username: e.code,
      name: e.nom,
      role: Role.MACHINISTE,
      password: "ksd22042001",
      assignedTemplateIds: [] as string[], // accès à toutes les fiches
    }));

  const chefsEquipeImportes = employesRSMACH
    .filter((e) => codesChefsEquipe.has(e.code))
    .map((e) => ({
      username: e.code,
      name: e.nom,
      role: Role.CHEF_EQUIPE,
      password: "ksd22042001",
    }));

  // ---------------------------------------------------------------------
  // Comptes de démonstration (à changer en production !)
  // ---------------------------------------------------------------------
  const users = [
    { username: "admin", name: "Administrateur", role: Role.ADMIN, password: "ksd22042001" },

    // Machinistes — importés depuis Coswin, accès total à toutes les fiches
    ...machinistesImportes,

    // Chefs d'équipe — importés depuis Coswin
    ...chefsEquipeImportes,

    { username: "2", name: "OUSMANE BOUKARY", role: Role.RESPONSABLE_PRODUCTION, password: "ksd22042001" },
    { username: "76", name: "BOUSSOU HENOCK", role: Role.RESPONSABLE_MAINTENANCE, password: "ksd22042001" },
    { username: "directeur", name: "Directeur Technique", role: Role.DIRECTEUR_TECHNIQUE, password: "ksd22042001" },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const assignedIds = ((u as any).assignedTemplateIds as string[] | undefined) ?? [];

    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        // IMPORTANT : on remet aussi à jour name/role/passwordHash sur les
        // comptes déjà existants, sinon un compte créé lors d'un run
        // antérieur (par ex. classé MACHINISTE avant l'ajout de la logique
        // CHEF_EQUIPE) reste bloqué sur son ancien rôle et/ou son ancien
        // mot de passe, même après un nouveau `prisma db seed`.
        name: u.name,
        role: u.role,
        passwordHash,
        assignedTemplates: {
          set: assignedIds.map((id) => ({ id })),
        },
      },
      create: {
        username: u.username,
        name: u.name,
        role: u.role,
        passwordHash,
        assignedTemplates: {
          connect: assignedIds.map((id) => ({ id })),
        },
      },
    });
  }

  console.log("Seed terminé.");
  console.log(`Fiches créées : ${machinesSidel.length} (SIDEL) + ${autresSystemes.length} (autres systèmes)`);
  console.log(`Machinistes importés (accès total) : ${machinistesImportes.length}`);
  console.log(`Chefs d'équipe importés : ${chefsEquipeImportes.length}`);
  console.log("Comptes créés (mot de passe: ksd22042001 à changer immédiatement) :");
  users.forEach((u) => console.log(`  - ${u.username} (${u.role}) — ${u.name}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());