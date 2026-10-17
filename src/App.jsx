import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AttackersPage from "./pages/AttackersPage.jsx";
import CommandDetailPage from "./pages/CommandDetailPage.jsx";
import CommandsPage from "./pages/CommandsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import IpDetailPage from "./pages/IpDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SessionDetailPage from "./pages/SessionDetailPage.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="attackers" element={<AttackersPage />} />
        <Route path="attackers/:ip" element={<IpDetailPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="commands" element={<CommandsPage />} />
        <Route path="commands/:key" element={<CommandDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
