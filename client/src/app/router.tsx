import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, useRouteError, Link } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoadingState } from "../components/LoadingState";
import { ProtectedRoute } from "../components/ProtectedRoute";

const HomePage = lazy(async () => {
  const module = await import("../pages/HomePage");
  return { default: module.HomePage };
});

const DiscoveryPage = lazy(async () => {
  const module = await import("../pages/DiscoveryPage");
  return { default: module.DiscoveryPage };
});

const LibraryPage = lazy(async () => {
  const module = await import("../pages/LibraryPage");
  return { default: module.LibraryPage };
});

const ShowDetailPage = lazy(async () => {
  const module = await import("../pages/ShowDetailPage");
  return { default: module.ShowDetailPage };
});

const PlayerPage = lazy(async () => {
  const module = await import("../pages/PlayerPage");
  return { default: module.PlayerPage };
});

const WatchlistPage = lazy(async () => {
  const module = await import("../pages/WatchlistPage");
  return { default: module.WatchlistPage };
});

const NotificationsPage = lazy(async () => {
  const module = await import("../pages/NotificationsPage");
  return { default: module.NotificationsPage };
});

const LoginPage = lazy(async () => {
  const module = await import("../pages/LoginPage");
  return { default: module.LoginPage };
});

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<LoadingState label="Loading page..." />}>
      {element}
    </Suspense>
  );
}

function ErrorPage() {
  const error = useRouteError() as any;
  console.error("Router Catch-all Error:", error);
  return (
    <div className="glass-panel rounded-3xl p-10 text-center text-white">
      <h2 className="text-2xl font-bold mb-4">Application Error</h2>
      <p className="text-red-400 mb-6">{error?.statusText || error?.message || "An unexpected error occurred."}</p>
      <Link to="/" className="bg-accent px-6 py-2 rounded-full text-black font-bold">Back to safety</Link>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />)
      },
      {
        path: "login",
        element: withSuspense(<LoginPage />)
      },
      {
        path: "library",
        element: <ProtectedRoute>{withSuspense(<LibraryPage />)}</ProtectedRoute>
      },
      {
        path: "watchlist",
        element: <ProtectedRoute>{withSuspense(<WatchlistPage />)}</ProtectedRoute>
      },
      {
        path: "discover",
        element: <ProtectedRoute>{withSuspense(<DiscoveryPage />)}</ProtectedRoute>
      },
      {
        path: "notifications",
        element: <ProtectedRoute>{withSuspense(<NotificationsPage />)}</ProtectedRoute>
      },
      {
        path: "shows/:showId",
        element: <ProtectedRoute>{withSuspense(<ShowDetailPage />)}</ProtectedRoute>
      },
      {
        path: "shows/:showId/watch/:episodeId",
        element: <ProtectedRoute>{withSuspense(<PlayerPage />)}</ProtectedRoute>
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
