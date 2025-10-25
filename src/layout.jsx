import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/ui/app-sidebar";
import { Outlet } from "react-router-dom";
import { AnimatedThemeToggler } from "./components/ui/animated-theme-toggler";
import useDarkSide from "./config/useDarkMode";
import { Toaster } from "./components/ui/sonner";




export default function Layout() {

  const [, toggleTheme] = useDarkSide();

  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="flex-1 p-4 items-center">
        <div className="flex items-center justify-between">
          <button className="cursor-pointer">
            <SidebarTrigger />
          </button>
          <AnimatedThemeToggler onClick={toggleTheme} />
        </div>
        <Outlet />
      </main>
      <Toaster />

    </SidebarProvider>
  );
}
