import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { logActiveMode } from "./lib/config";
import Landing from "./pages/Landing";
import Guest from "./pages/Guest";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";

logActiveMode();

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/r/:slug", element: <Guest /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/onboarding", element: <Onboarding /> },
  { path: "*", element: <Landing /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
