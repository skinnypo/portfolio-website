import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const Play = lazy(() => import("./pages/Play"));
import { LoadingProvider } from "./context/LoadingProvider";

const CanonicalUrl = () => {
  const location = useLocation();

  useEffect(() => {
    const siteUrl = import.meta.env.VITE_SITE_URL;
    if (!siteUrl) return;

    const path = location.pathname === "/" ? "" : location.pathname;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${siteUrl}${path}`;
  }, [location.pathname]);

  return null;
};

const PAGE_TITLES: Record<string, string> = {
  "/": "I Putu Krisna | Data Engineer",
  "/myworks": "Projects | I Putu Krisna",
  "/play": "Play Chess | I Putu Krisna",
};

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const normalizedPath = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const pageTitle = PAGE_TITLES[normalizedPath];
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <CanonicalUrl />
      <PageTitle />
      <Routes>
        <Route
          path="/"
          element={
            <LoadingProvider>
              <Suspense>
                <MainContainer>
                  <Suspense>
                    <CharacterModel />
                  </Suspense>
                </MainContainer>
              </Suspense>
            </LoadingProvider>
          }
        />
        <Route
          path="/myworks"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <MyWorks />
            </Suspense>
          }
        />
        <Route
          path="/play"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Play />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
