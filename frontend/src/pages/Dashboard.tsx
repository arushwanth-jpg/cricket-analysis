import { useEffect, useState } from "react";
import {
  Activity,
  Trophy,
  Users,
  CalendarDays,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

interface DashboardData {
  summary: {
    total_teams: number;
    total_players: number;
    total_matches: number;
    completed_matches: number;
    live_matches: number;
    upcoming_matches: number;
  };
  team_statistics: {
    id: number;
    name: string;
    short_name: string;
    matches_won: number;
  }[];
  recent_matches: {
    id: number;
    match_name: string;
    team1_name: string;
    team2_name: string;
    match_format: string;
    venue: string;
    result: string;
    status: string;
    match_date: string;
  }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("analytics/dashboard/")
      .then((response) => setData(response.data))
      .catch(() => {
        setError("Unable to load dashboard data. Check the backend server.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page dashboard-state">
        <div>
          <div className="dashboard-loader" />
          <p>Loading cricket analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-page dashboard-state dashboard-error">
        {error || "No dashboard data available"}
      </div>
    );
  }

  const { summary, team_statistics, recent_matches } = data;

  const stats = [
    {
      label: "Total Matches",
      value: summary.total_matches,
      icon: Activity,
      iconClass: "dashboard-icon-blue",
    },
    {
      label: "Teams",
      value: summary.total_teams,
      icon: Trophy,
      iconClass: "dashboard-icon-amber",
    },
    {
      label: "Players",
      value: summary.total_players,
      icon: Users,
      iconClass: "dashboard-icon-green",
    },
    {
      label: "Completed",
      value: summary.completed_matches,
      icon: CalendarDays,
      iconClass: "dashboard-icon-purple",
    },
  ];

  const matchStatuses = [
    {
      label: "Completed",
      value: summary.completed_matches,
      className: "dashboard-status-completed",
    },
    {
      label: "Live",
      value: summary.live_matches,
      className: "dashboard-status-live",
    },
    {
      label: "Upcoming",
      value: summary.upcoming_matches,
      className: "dashboard-status-upcoming",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div>
          <h2>Cricket Dashboard</h2>
          <p>Match insights and performance overview</p>
        </div>

        <div className="dashboard-header-badge">IPL · Sample Data</div>
      </header>

      <main className="dashboard-content">
        {/* KPI Cards */}
        <section className="dashboard-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="dashboard-stat-card" key={stat.label}>
                <div className="dashboard-stat-top">
                  <span className="dashboard-stat-label">{stat.label}</span>

                  <div className={`dashboard-stat-icon ${stat.iconClass}`}>
                    <Icon size={20} />
                  </div>
                </div>

                <p className="dashboard-stat-value">{stat.value}</p>

                <p className="dashboard-stat-description">
                  Current database records
                </p>
              </div>
            );
          })}
        </section>

        {/* Charts */}
        <section className="dashboard-charts-grid">
          {/* Team Wins Chart */}
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h3>Team Wins</h3>
                <p>Completed match victories</p>
              </div>

              <TrendingUp
                className="dashboard-panel-header-icon"
                size={22}
              />
            </div>

            <div style={{ width: "100%", height: 288 }}>
              {team_statistics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={team_statistics}
                    margin={{ top: 8, right: 10, left: -15, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#263247"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="short_name"
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke="#94a3b8"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#111a2b",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                      labelStyle={{ color: "#cbd5e1" }}
                      formatter={(value) => [value, "Wins"]}
                    />

                    <Bar
                      dataKey="matches_won"
                      name="Wins"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-chart-empty">
                  No team win statistics available.
                </div>
              )}
            </div>
          </div>

          {/* Match Status */}
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h3>Match Status</h3>
                <p>Match distribution</p>
              </div>
            </div>

            <div className="dashboard-status-list">
              {matchStatuses.map((item) => {
                const percentage = summary.total_matches
                  ? (item.value / summary.total_matches) * 100
                  : 0;

                return (
                  <div className="dashboard-status-item" key={item.label}>
                    <div className="dashboard-status-label-row">
                      <span>{item.label}</span>
                      <span className="dashboard-status-value">
                        {item.value}
                      </span>
                    </div>

                    <div className="dashboard-status-track">
                      <div
                        className={`dashboard-status-fill ${item.className}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dashboard-insights-box">
              <div className="dashboard-insights-title">
                <Target size={18} />
                <span>Match Insights</span>
              </div>

              <p>
                Explore team victories and completed match results.
              </p>
            </div>
          </div>
        </section>

        {/* Recent Matches */}
        <section className="dashboard-recent-panel">
          <div className="dashboard-recent-header">
            <div>
              <h3>Recent Matches</h3>
              <p>Latest match records</p>
            </div>

            <Link to="/matches" className="dashboard-view-all">
              View all
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="dashboard-recent-list">
            {recent_matches.length > 0 ? (
              recent_matches.map((match) => (
                <Link
                  to={`/matches/${match.id}`}
                  key={match.id}
                  className="dashboard-match-row"
                >
                  <div>
                    <p className="dashboard-match-teams">
                      {match.team1_name}{" "}
                      <span className="dashboard-match-vs">vs</span>{" "}
                      {match.team2_name}
                    </p>

                    <p className="dashboard-match-meta">
                      {match.venue} · {match.match_format}
                    </p>
                  </div>

                  <div className="dashboard-match-result">
                    <span className="dashboard-match-status">
                      {match.status}
                    </span>

                    <p className="dashboard-match-result-text">
                      {match.result || "Result unavailable"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="dashboard-chart-empty">
                No recent matches available.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}