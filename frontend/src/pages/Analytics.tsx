import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import "./Analytics.css";
import api from "../services/api";

interface AnalyticsData {
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
}

const chartTooltipStyle = {
  backgroundColor: "#111c30",
  border: "1px solid #334155",
  borderRadius: "10px",
  color: "#f8fafc",
};

const STATUS_COLORS = {
  Completed: "#22c55e",
  Live: "#f97316",
  Upcoming: "#3b82f6",
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("analytics/dashboard/")
      .then((response) => {
        setData(response.data);
      })
      .catch(() => {
        setError("Unable to load analytics data. Check that the backend is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const matchStatusData = useMemo(() => {
    if (!data) return [];

    return [
      { name: "Completed", value: data.summary.completed_matches },
      { name: "Live", value: data.summary.live_matches },
      { name: "Upcoming", value: data.summary.upcoming_matches },
    ];
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Total Matches",
        value: data.summary.total_matches,
        description: "All scheduled matches",
        accent: "blue",
      },
      {
        label: "Completed",
        value: data.summary.completed_matches,
        description: "Matches finished",
        accent: "green",
      },
      {
        label: "Live Matches",
        value: data.summary.live_matches,
        description: "Currently in progress",
        accent: "orange",
      },
      {
        label: "Upcoming",
        value: data.summary.upcoming_matches,
        description: "Scheduled fixtures",
        accent: "purple",
      },
      {
        label: "Teams",
        value: data.summary.total_teams,
        description: "Teams in database",
        accent: "cyan",
      },
      {
        label: "Players",
        value: data.summary.total_players,
        description: "Players in database",
        accent: "pink",
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-state-card">
          <div className="analytics-loader" />
          <p>Loading cricket analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-page">
        <div className="analytics-state-card analytics-error">
          <h2>Analytics unavailable</h2>
          <p>{error || "No analytics data found."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="analytics-retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">CRICKET INSIGHTS</p>
          <h1>Analytics</h1>
          <p className="analytics-subtitle">
            Cricket statistics and match performance overview.
          </p>
        </div>

        <div className="analytics-header-badge">
          <span className="analytics-live-dot" />
          Dashboard Overview
        </div>
      </header>

      <section className="analytics-stats">
        {stats.map((stat) => (
          <article
            className={`analytics-stat-card analytics-stat-${stat.accent}`}
            key={stat.label}
          >
            <div className="analytics-stat-top">
              <p>{stat.label}</p>
              <span className="analytics-stat-indicator" />
            </div>

            <h2>{stat.value.toLocaleString()}</h2>
            <span className="analytics-stat-description">
              {stat.description}
            </span>
          </article>
        ))}
      </section>

      <section className="analytics-charts">
        <article className="analytics-chart-card analytics-wins-card">
          <div className="analytics-chart-heading">
            <div>
              <h2>Team Wins</h2>
              <p>Matches won by each team</p>
            </div>
            <span className="analytics-chart-tag">Performance</span>
          </div>

          {data.team_statistics.length === 0 ? (
            <div className="analytics-chart-empty">
              No team statistics available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={data.team_statistics}
                margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#26364f"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="short_name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#7dd3fc" }}
                  labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                  cursor={{ fill: "rgba(56, 189, 248, 0.07)" }}
                />
                <Bar
                  dataKey="matches_won"
                  name="Matches Won"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="analytics-chart-card analytics-status-card">
          <div className="analytics-chart-heading">
            <div>
              <h2>Match Status</h2>
              <p>Distribution of match progress</p>
            </div>
            <span className="analytics-chart-tag">Overview</span>
          </div>

          {data.summary.total_matches === 0 ? (
            <div className="analytics-chart-empty">
              No matches available.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={matchStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {matchStatusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          STATUS_COLORS[
                            entry.name as keyof typeof STATUS_COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{ color: "#f8fafc" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="analytics-status-legend">
                {matchStatusData.map((item) => (
                  <div className="analytics-legend-item" key={item.name}>
                    <span
                      className="analytics-legend-dot"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[
                            item.name as keyof typeof STATUS_COLORS
                          ],
                      }}
                    />
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>
    </div>
  );
}