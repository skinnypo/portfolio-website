import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import content from "./data";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const Play = lazy(() => import("./pages/Play"));
import { LoadingProvider } from "./context/LoadingProvider";

const App = () => {
  const { bio } = content;
  if (bio) {
    document.title = `${bio.fullName} — ${bio.title}`;
  }

  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_ID;
    const siteUrl = import.meta.env.VITE_SITE_URL;

    if (siteUrl) {
      const canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = siteUrl;
      document.head.appendChild(canonical);
    }

    if (!gaId) return;
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args) => window.dataLayer.push(args);
    window.gtag("js", new Date());
    window.gtag("config", gaId, { send_page_view: true });
  }, []);

  return (
    <BrowserRouter>
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
