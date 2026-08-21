import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";

function getAdminJwtSecret() {
  return new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || "dev-admin-secret-change-me"
  );
}

async function isValidAdminSession(request: NextRequest): Promise<boolean> {
  const adminToken = request.cookies.get("adpromo_admin_session")?.value;
  if (!adminToken) return false;

  try {
    await jwtVerify(adminToken, getAdminJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/register"];
  const isPublic = publicPaths.includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");
  const isLegacyAdminLogin = pathname === "/admin/login";
  const isApiRoute = pathname.startsWith("/api");

  try {
    if (isLegacyAdminLogin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isApiRoute) {
      return NextResponse.next();
    }

    const adminValid = await isValidAdminSession(request);

    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
      if (adminValid) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    if (isAdminRoute) {
      if (!adminValid) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      if (!isPublic) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (user && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[middleware]", pathname, error);

    if (isPublic || pathname === "/login") {
      return NextResponse.next();
    }

    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
