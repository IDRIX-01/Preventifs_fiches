import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Ce middleware s'exécute côté SERVEUR avant même que la page ne se charge.
// C'est essentiel : cacher un lien "/admin" dans l'UI ne suffit jamais,
// n'importe qui pourrait taper l'URL directement. Ici, la vérification du
// rôle est faite sur chaque requête, impossible à contourner depuis le navigateur.
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    if (isAdminRoute && token?.role !== "ADMIN") {
      // Redirige vers le dashboard normal — pas d'accès, pas d'exception.
      return NextResponse.redirect(new URL("/dashboard?denied=admin", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // il faut au minimum être connecté
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/fiches/:path*"],
};
