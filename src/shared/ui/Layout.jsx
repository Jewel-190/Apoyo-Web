import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

const Layout = () => {
  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <ScrollToTop />
      <Navbar />
      <div
        id="app-scroll"
        className="h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-20"
      >
        <main className="min-w-0">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
