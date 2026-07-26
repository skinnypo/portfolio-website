import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const Play = lazy(() => import("./pages/Play"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Stories = lazy(() => import("./pages/Stories"));
import { LoadingProvider } from "./context/LoadingProvider";
import Cursor from "./components/Cursor";
import content from "./data";

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
  "/stories": "Stories | I Putu Krisna",
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "Portfolio of I Putu Krisna, a Data Engineer in Indonesia specializing in Databricks, Snowflake, and scalable data pipelines.",
  "/myworks": "Every project I Putu Krisna has engineered, from spec to ship.",
  "/play": "Play chess against a custom engine, built by I Putu Krisna.",
  "/stories": "Life, sports, and the roads that aren't on any project timeline of I Putu Krisna.",
};

const ARTICLE_PATH_PREFIX = "/articles/";
const ARTICLE_JSONLD_ID = "article-jsonld";

function setMetaTag(selector: string, createAttrs: Record<string, string>, value: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(createAttrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function removeArticleJsonLd() {
  document.getElementById(ARTICLE_JSONLD_ID)?.remove();
}

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const normalizedPath = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const siteUrl = import.meta.env.VITE_SITE_URL ?? "";

    if (normalizedPath.startsWith(ARTICLE_PATH_PREFIX)) {
      const slug = normalizedPath.slice(ARTICLE_PATH_PREFIX.length);
      const article = content.articles.find((a) => a.slug.toLowerCase() === slug);

      if (!article) {
        document.title = "Article Not Found | I Putu Krisna";
        removeArticleJsonLd();
        return;
      }

      document.title = `${article.title} | I Putu Krisna`;
      setMetaTag('meta[name="description"]', { name: "description" }, article.description);
      setMetaTag('meta[property="og:title"]', { property: "og:title" }, article.title);
      setMetaTag('meta[property="og:description"]', { property: "og:description" }, article.description);
      if (article.coverImage) {
        setMetaTag('meta[property="og:image"]', { property: "og:image" }, article.coverImage);
      }

      removeArticleJsonLd();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = ARTICLE_JSONLD_ID;
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        image: article.coverImage ?? undefined,
        author: { "@type": "Person", name: "I Putu Krisna" },
        url: `${siteUrl}${location.pathname}`,
      });
      document.head.appendChild(script);
      return;
    }

    removeArticleJsonLd();
    setMetaTag('meta[property="og:image"]', { property: "og:image" }, `${siteUrl}/images/mypicnbg.png`);
    const pageTitle = PAGE_TITLES[normalizedPath];
    if (pageTitle) {
      document.title = pageTitle;
    }
    const pageDescription = PAGE_DESCRIPTIONS[normalizedPath];
    if (pageDescription) {
      setMetaTag('meta[name="description"]', { name: "description" }, pageDescription);
      setMetaTag('meta[property="og:title"]', { property: "og:title" }, pageTitle ?? "I Putu Krisna");
      setMetaTag('meta[property="og:description"]', { property: "og:description" }, pageDescription);
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <Cursor />
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
        <Route
          path="/articles/:slug"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <ArticleDetail />
            </Suspense>
          }
        />
        <Route
          path="/stories"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Stories />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
