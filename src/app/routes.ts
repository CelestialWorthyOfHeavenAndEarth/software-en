import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Candidates } from "./pages/Candidates";
import { CandidateDetail } from "./pages/CandidateDetail";
import { ScreenResumes } from "./pages/ScreenResumes";
import { JobPositions } from "./pages/JobPositions";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Analytics } from "./pages/Analytics";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "candidates", Component: Candidates },
          { path: "candidates/:id", Component: CandidateDetail },
          { path: "screen", Component: ScreenResumes },
          { path: "positions", Component: JobPositions },
          { path: "analytics", Component: Analytics },
          { path: "settings", Component: Settings },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
