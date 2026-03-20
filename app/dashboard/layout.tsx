import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { RightSidebar } from "~/components/ui/right-sidebar";
import { useAuthStore } from "~/store/authStore";
import { Navigate, Outlet, useNavigate } from "react-router";
import { FullPageLoader } from "~/components/FullPageLoader";
import { getPrimaryColor } from "~/lib/erpBranding";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { NotificationBell } from "~/components/ui/notification-bell";
import supabase from "~/utils/supabase";

function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="lg:hidden mb-2 w-12 h-12 shrink-0"
    >
      <Menu className="!w-8 !h-8 text-primary-blue" />
    </Button>
  );
}

const SESSION_CHECK_TIMEOUT_MS = 30_000;

export default function Layout() {
  const { user, hasHydrated, logout: logoutUser, login } = useAuthStore();
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  // Importante: depender de user?.id, no de `user` entero. Cada login() sustituye el
  // objeto en el store; si el efecto depende de `user`, se re-ejecuta en bucle, el cleanup
  // marca alive=false y el finally de la validación anterior no hace setCheckingSession(false).
  const userId = user?.id;

  // Los hooks deben ejecutarse siempre en el mismo orden (nunca después de un return condicional).
  useEffect(() => {
    if (!hasHydrated) return;

    if (!userId) {
      setCheckingSession(false);
      return;
    }

    setCheckingSession(true);
    let alive = true;

    const mapToAppUser = (authUser: any) => {
      const email = authUser?.email;
      if (!authUser?.id || !email) return null;
      return {
        id: String(authUser.id),
        email: String(email),
        created_at: String(authUser.created_at ?? new Date().toISOString()),
        user_metadata: authUser.user_metadata ?? {},
      };
    };

    const timeoutId = window.setTimeout(() => {
      if (!alive) return;
      alive = false;
      logoutUser();
      navigate("/login");
      setCheckingSession(false);
    }, SESSION_CHECK_TIMEOUT_MS);

    const validateSession = async () => {
      try {
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();

        if (sessionErr) throw sessionErr;
        if (!session) {
          if (!alive) return;
          logoutUser();
          navigate("/login");
          return;
        }

        const { data: authData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const appUser = mapToAppUser(authData?.user);
        if (!appUser) {
          logoutUser();
          navigate("/login");
          return;
        }
        if (!alive) return;
        login(appUser);
      } catch {
        if (!alive) return;
        logoutUser();
        navigate("/login");
      } finally {
        window.clearTimeout(timeoutId);
        if (alive) setCheckingSession(false);
      }
    };

    void validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!alive) return;
      if (event === "SIGNED_OUT") {
        logoutUser();
        navigate("/login");
      }
    });

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [hasHydrated, userId, login, logoutUser, navigate]);

  if (!hasHydrated) {
    return <FullPageLoader label="Preparando sesión…" />;
  }

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }

  if (checkingSession) {
    return <FullPageLoader label="Verificando sesión…" />;
  }

  return (
    <SidebarProvider style={{
        "--sidebar-width": "17rem",
        "--sidebar-background": getPrimaryColor()
    } as React.CSSProperties }>
      <AppSidebar />
      <main className="py-12 px-4 sm:px-8 text-primary-blue flex-1 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 w-full">
          <div className="flex w-full items-center gap-2">
            <div className="lg:hidden shrink-0">
              <MobileMenuButton />
            </div>
            <div className="flex-1 min-w-0" aria-hidden />
            <NotificationBell />
          </div>
          <Outlet />
        </div>
      </main>
      <RightSidebar />
    </SidebarProvider>
  );
}
