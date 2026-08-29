import React, { lazy } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Layout from "./shared/ui/Layout";
import { useWebContent } from "./shared/content/WebContentContext";
import { LEGAL_PAGE_PATH } from "./shared/lib/legalSettings";

const HomePage = lazy(() => import("./pages/HomePage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const AboutPage = lazy(() => import("./pages/About Page/AboutPage"));
const LegalPage = lazy(() => import("./pages/About Page/Pages/LegalPage"));

if (typeof window !== "undefined") {
  const path = window.location.pathname;
  if (path.startsWith("/services")) import("./pages/ServicesPage");
  else if (path.startsWith("/about")) import("./pages/About Page/AboutPage");
  else if (path.startsWith("/legal") || path.startsWith("/terms") || path.startsWith("/privacy")) {
    import("./pages/About Page/Pages/LegalPage");
  } else {
    import("./pages/HomePage");
  }
}

function AppSplash() {
  return (
    <div className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to">
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function AppError({ message, onRetry }) {
  return (
    <div className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-gradient-to-r from-brand-page-from via-brand-page-via to-brand-page-to px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/90 p-8 text-center shadow-sm backdrop-blur-sm">
        <p className="text-sm font-semibold text-gray-900">This page isn’t available right now.</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function App() {
  const { status, error, reload } = useWebContent();

  if (status === "loading") return <AppSplash />;
  if (status === "error") return <AppError message={error} onRetry={reload} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="legal" element={<Navigate to={LEGAL_PAGE_PATH} replace />} />
          <Route path="legal/:slug" element={<LegalPage />} />
          <Route path="terms" element={<Navigate to="/legal" replace />} />
          <Route path="privacy" element={<Navigate to="/legal" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
