import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { RightSidebar } from "~/components/ui/right-sidebar";
import { useAuthStore } from "~/store/authStore";
import { Navigate, Outlet } from "react-router";
import Loading from "~/components/root/Loading/Loading";
import { getPrimaryColor } from "~/lib/erpBranding";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { NotificationBell } from "~/components/ui/notification-bell";

function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="lg:hidden w-12 h-12 shrink-0"
    >
      <Menu className="!w-8 !h-8 text-primary-blue" />
    </Button>
  );
}

export default function Layout() {
  const { user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to={"login"} replace />;
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
