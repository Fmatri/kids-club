import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Portier rapide : renvoie vers /connexion les visiteurs SANS cookie de session.
// ATTENTION : il ne vérifie pas que le cookie est valide.
// La vraie vérification est faite dans chaque page avec exigerAdmin().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }
  return NextResponse.next();
}

// Le portier ne surveille que /admin et toutes ses sous-pages
export const config = {
  matcher: ["/admin/:path*"],
};