import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <SkipLink />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
