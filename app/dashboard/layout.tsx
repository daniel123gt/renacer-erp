import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { RightSidebar } from "~/components/ui/right-sidebar";
import { useAuthStore } from "~/store/authStore";
import { Navigate, Outlet } from "react-router";
import Loading from "~/components/root/Loading/Loading";
import { getPrimaryColor } from "~/lib/erpBranding";

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
      <main className="py-12 px-8 text-primary-blue flex-1 max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <Outlet />
        </div>
      </main>
      <RightSidebar />
    </SidebarProvider>
  );
}
