import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pdg/:path*",
    "/tresorerie/:path*",
    "/commercial/:path*",
    "/livreur/:path*",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
