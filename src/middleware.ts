import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "dev-admin-secret-change-me"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicPaths = ["/", "/login", "/register"];
  const isPublic = publicPaths.includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) {
    return supabaseResponse;
  }

  if (isAdminRoute) {
    const adminToken = request.cookies.get("adpromo_admin_session")?.value;
    let adminValid = false;

    if (adminToken) {
      try {
        await jwtVerify(adminToken, ADMIN_JWT_SECRET);
        adminValid = true;
      } catch {
        adminValid = false;
      }
    }

    if (isAdminLogin && adminValid) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (!isAdminLogin && !adminValid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return supabaseResponse;
  }

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
