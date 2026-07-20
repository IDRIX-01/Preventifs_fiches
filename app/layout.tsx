import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "QHSE Maintenance — Fiches d'entretien",
  description: "Digitalisation des fiches d'entretien préventif",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
