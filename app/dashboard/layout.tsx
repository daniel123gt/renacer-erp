import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { RightSidebar } from "~/components/ui/right-sidebar";
import { useAuthStore } from "~/store/authStore";
import { Navigate, Outlet } from "react-router";
import Loading from "~/components/root/Loading/Loading";
import { getPrimaryColor } from "~/lib/erpBranding";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";

function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="lg:hidden mb-2 w-12 h-12"
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
        <MobileMenuButton />
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <Outlet />
        </div>
      </main>
      <RightSidebar />
    </SidebarProvider>
  );
}
