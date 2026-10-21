import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PublicFooter } from "../components/public/PublicFooter";
import { PublicHeader } from "../components/public/PublicHeader";

// page layout for the public website
export function PublicLayout() {
  const { pathname } = useLocation();

  // start each public page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-700">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy focus:shadow"
      >
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
