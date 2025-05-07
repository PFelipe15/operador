import { NextResponse, type NextRequest } from "next/server";

// Rotas que não precisam de autenticação
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/v1/auth",
];

// Rotas de API que não precisam de autenticação
const publicApiRoutes = ["/api/auth/login", "/api/auth/register"];

const secretBotApi = process.env.SECRET_BOT_API;

const apisBotRoutes = [
  "/api/v1/clients",
  "/api/v1/processes",
  "/api/v1/bot",
  "/api/v1/bot/clients",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Redireciona / para /operador/dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/operador/dashboard", request.url));
  }

  // Verifica se é uma rota pública
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Se estiver autenticado e tentar acessar login/register, redireciona para dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/operador/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Verifica se é uma rota de API
  if (pathname.startsWith("/api/")) {
    // Permite rotas de API públicas
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Verifica rotas do bot
    if (apisBotRoutes.some((route) => pathname.startsWith(route))) {
      const secret = request.headers.get("x-secret-bot-api");

      if (
        secret === secretBotApi ||
        (pathname === "/api/bot" && request.method === "PUT") ||
        token
      ) {
        return NextResponse.next();
      }

      return NextResponse.json(
        { error: "Unauthorized", description: "Authentication required" },
        { status: 401 }
      );
    }

    // Para outras rotas de API, exige autenticação
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", description: "Authentication required" },
        { status: 401 }
      );
    }
  }

  // Para rotas não-API, redireciona para login se não estiver autenticado
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
