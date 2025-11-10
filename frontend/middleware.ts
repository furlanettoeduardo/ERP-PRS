import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const { pathname } = request.nextUrl;

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/auth/login', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Se estiver em rota pública e tiver token, redirecionar para dashboard
  if (isPublicRoute && accessToken && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se estiver em rota protegida e não tiver token, redirecionar para login
  // Rotas protegidas: /dashboard/*, /estoque/*, /usuarios/*, /produtos/*, /pedidos/*, /relatorios/*, /configuracoes/*, /perfil/*, /integracoes/*
  const protectedPaths = ['/dashboard', '/estoque', '/usuarios', '/produtos', '/pedidos', '/relatorios', '/configuracoes', '/perfil', '/integracoes'];
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
