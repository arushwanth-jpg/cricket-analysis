import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import {
  Activity,
  Trophy,
  Users,
  CircleDot,
  TrendingUp,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Matches from "./pages/matches";
import Teams from "./pages/teams";
import PlayerDetails from "./pages/PlayerDetails";
import MatchDetails from "./pages/MatchDetails";
import TeamDetails from "./pages/TeamDetails";
import Analytics from "./pages/Analytics";

function App() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
      isActive
        ? "bg-emerald-500/10 text-emerald-400"
        : "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"
    }`;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#080d18] text-slate-100">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0c1321] p-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500 p-2">
              <Activity className="text-white" size={24} />
            </div>

            <div>
              <h1 className="text-lg font-bold">CricAnalytics</h1>
              <p className="text-xs text-slate-500">
                Performance Intelligence
              </p>
            </div>
          </div>

          <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-2">
            <NavLink to="/" end className={navLinkClass}>
              <Activity size={18} />
              Dashboard
            </NavLink>

            <NavLink to="/matches" className={navLinkClass}>
              <CircleDot size={18} />
              Matches
            </NavLink>

            <NavLink to="/players" className={navLinkClass}>
              <Users size={18} />
              Players
            </NavLink>

            <NavLink to="/teams" className={navLinkClass}>
              <Trophy size={18} />
              Teams
            </NavLink>

            <NavLink to="/analytics" className={navLinkClass}>
              <TrendingUp size={18} />
              Analytics
            </NavLink>
          </nav>

          <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-emerald-400">
              Cricket Intelligence
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Analyze matches, players and team performance.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players/:id" element={<PlayerDetails />} />
            <Route path="/players" element={<Players />} />
            <Route path="/matches/:id" element={<MatchDetails />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/teams/:id" element={<TeamDetails />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;