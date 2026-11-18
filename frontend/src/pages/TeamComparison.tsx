
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import api from "../services/api";
import "./TeamComparison.css";

interface Team {
  id: number;
  name: string;
  short_name?: string;
  country?: string;
  logo_url?: string | null;
}

interface ComparedTeam extends Team {
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  no_results: number;
  win_percentage: number;
}

interface RecentMatch {
  id: number;
  match_name: string;
  team1: string;
  team2: string;
  match_format: string;
  venue: string;
  match_date: string;
  winner: string | null;
  result: string;
  status: "TEAM1_WIN" | "TEAM2_WIN" | "DRAW" | "NO_RESULT";
}

interface ComparisonResponse {
  team1: ComparedTeam;
  team2: ComparedTeam;
  summary: {
    total_matches: number;
    draws: number;
    no_results: number;
    format: string;
  };
  recent_matches: RecentMatch[];
}

const FORMATS = [
  { label: "All Formats", value: "" },
  { label: "T20", value: "T20" },
  { label: "ODI", value: "ODI" },
  { label: "Test", value: "TEST" },
  { label: "T10", value: "T10" },
];

const tooltipStyle = {
  backgroundColor: "#111c30",
  border: "1px solid #334155",
  borderRadius: "10px",
  color: "#f8fafc",
};

function getTeamList(data: any): Team[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatDate(value: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPercentage(value: number | null | undefined) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export default function TeamComparison() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [matchFormat, setMatchFormat] = useState("");

  const [comparison, setComparison] =
    useState<ComparisonResponse | null>(null);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [teamsError, setTeamsError] = useState("");
  const [error, setError] = useState("");

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    setTeamsError("");

    try {
      const response = await api.get("teams/");
      setTeams(getTeamList(response.data));
    } catch (err) {
      console.error("Team loading error:", err);
      setTeamsError("Unable to load teams. Please check the backend connection.");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const compareTeams = async () => {
    setError("");
    setComparison(null);

    if (!team1Id || !team2Id) {
      setError("Please select both teams.");
      return;
    }

    if (team1Id === team2Id) {
      setError("Please select two different teams.");
      return;
    }

    setComparing(true);

    try {
      const params: Record<string, string> = {
        team1: team1Id,
        team2: team2Id,
      };

      if (matchFormat) {
        params.format = matchFormat;
      }

      const response = await api.get(
        "team_statistics/compare/",
        { params }
      );

      setComparison(response.data);
    } catch (err: any) {
      console.error("Team comparison error:", err);

      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to compare teams. Please try again."
      );
    } finally {
      setComparing(false);
    }
  };

  const chartData = useMemo(() => {
    if (!comparison) return [];

    return [
      {
        metric: "Wins",
        team1: comparison.team1.wins,
        team2: comparison.team2.wins,
      },
      {
        metric: "Losses",
        team1: comparison.team1.losses,
        team2: comparison.team2.losses,
      },
      {
        metric: "Draws",
        team1: comparison.team1.draws,
        team2: comparison.team2.draws,
      },
      {
        metric: "No Results",
        team1: comparison.team1.no_results,
        team2: comparison.team2.no_results,
      },
    ];
  }, [comparison]);

  const renderTeamCard = (
    team: ComparedTeam,
    label: string
  ) => (
    <article className="team-comparison-team-card">
      <div className="team-comparison-logo">
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt={team.name}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>
            {(team.short_name || team.name).charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <span className="team-comparison-label">{label}</span>

      <h2>{team.name}</h2>

      <p>{team.country || "Country unavailable"}</p>

      <div className="team-comparison-win-percentage">
        <strong>{formatPercentage(team.win_percentage)}</strong>
        <span>Win Percentage</span>
      </div>

      <div className="team-comparison-card-stats">
        <div>
          <strong>{team.wins}</strong>
          <span>Wins</span>
        </div>
        <div>
          <strong>{team.losses}</strong>
          <span>Losses</span>
        </div>
        <div>
          <strong>{team.draws}</strong>
          <span>Draws</span>
        </div>
      </div>
    </article>
  );

  const renderMetric = (
    label: string,
    value1: number,
    value2: number
  ) => {
    const winner =
      value1 > value2
        ? "team1"
        : value2 > value1
          ? "team2"
          : "tie";

    return (
      <div className="team-comparison-metric-row" key={label}>
        <strong
          className={winner === "team1" ? "team-metric-winner" : ""}
        >
          {value1}
        </strong>

        <span>
          {label}
          <small>{winner === "tie" ? "Tie" : `${winner === "team1" ? "Team 1" : "Team 2"} leads`}</small>
        </span>

        <strong
          className={winner === "team2" ? "team-metric-winner" : ""}
        >
          {value2}
        </strong>
      </div>
    );
  };

  return (
    <div className="team-comparison-page">
      <header className="team-comparison-header">
        <div>
          <p className="team-comparison-eyebrow">CRICKET INSIGHTS</p>
          <h1>Head-to-Head Comparison</h1>
          <p className="team-comparison-subtitle">
            Compare team records and historical match performances.
          </p>
        </div>

        <div className="team-comparison-header-badge">
          <span />
          Team Analysis
        </div>
      </header>

      <section className="team-comparison-selection-card">
        <div className="team-comparison-section-heading">
          <div>
            <h2>Select Teams</h2>
            <p>Choose two teams to compare their head-to-head records.</p>
          </div>
        </div>

        {teamsError && (
          <div className="team-comparison-error" role="alert">
            {teamsError}
            <button type="button" onClick={loadTeams}>
              Retry
            </button>
          </div>
        )}

        <div className="team-comparison-selection-grid">
          <div className="team-comparison-input-group">
            <label htmlFor="comparison-team-one">Team 1</label>

            <select
              id="comparison-team-one"
              value={team1Id}
              onChange={(event) => {
                setTeam1Id(event.target.value);
                setComparison(null);
                setError("");
              }}
              disabled={loadingTeams}
            >
              <option value="">
                {loadingTeams ? "Loading teams..." : "Select Team 1"}
              </option>

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="team-comparison-vs">VS</div>

          <div className="team-comparison-input-group">
            <label htmlFor="comparison-team-two">Team 2</label>

            <select
              id="comparison-team-two"
              value={team2Id}
              onChange={(event) => {
                setTeam2Id(event.target.value);
                setComparison(null);
                setError("");
              }}
              disabled={loadingTeams}
            >
              <option value="">
                {loadingTeams ? "Loading teams..." : "Select Team 2"}
              </option>

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="team-comparison-actions">
          <div className="team-comparison-input-group team-comparison-format">
            <label htmlFor="team-comparison-format">Match Format</label>

            <select
              id="team-comparison-format"
              value={matchFormat}
              onChange={(event) => {
                setMatchFormat(event.target.value);
                setComparison(null);
                setError("");
              }}
            >
              {FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="team-comparison-submit"
            onClick={compareTeams}
            disabled={comparing || loadingTeams || teams.length < 2}
          >
            {comparing ? "Comparing..." : "Compare Teams"}
          </button>
        </div>

        {error && (
          <div className="team-comparison-error" role="alert">
            {error}
          </div>
        )}
      </section>

      {comparison && (
        <div className="team-comparison-results">
          <section className="team-comparison-cards">
            {renderTeamCard(comparison.team1, "TEAM 1")}

            <div className="team-comparison-center-vs">VS</div>

            {renderTeamCard(comparison.team2, "TEAM 2")}
          </section>

          <section className="team-comparison-overview">
            <article>
              <span>Total Head-to-Head Matches</span>
              <strong>{comparison.summary.total_matches}</strong>
            </article>

            <article>
              <span>Draws / Ties</span>
              <strong>{comparison.summary.draws}</strong>
            </article>

            <article>
              <span>No Results</span>
              <strong>{comparison.summary.no_results}</strong>
            </article>
          </section>

          <section className="team-comparison-stat-card">
            <div className="team-comparison-section-heading">
              <div>
                <h2>Head-to-Head Statistics</h2>
                <p>Historical performance comparison.</p>
              </div>
              <span className="team-comparison-tag">
                {comparison.summary.format}
              </span>
            </div>

            <div className="team-comparison-team-names">
              <span>{comparison.team1.name}</span>
              <span>{comparison.team2.name}</span>
            </div>

            <div className="team-comparison-metrics">
              {renderMetric(
                "Matches Played",
                comparison.team1.matches_played,
                comparison.team2.matches_played
              )}

              {renderMetric(
                "Wins",
                comparison.team1.wins,
                comparison.team2.wins
              )}

              {renderMetric(
                "Losses",
                comparison.team1.losses,
                comparison.team2.losses
              )}

              {renderMetric(
                "Draws",
                comparison.team1.draws,
                comparison.team2.draws
              )}

              {renderMetric(
                "No Results",
                comparison.team1.no_results,
                comparison.team2.no_results
              )}
            </div>
          </section>

          <section className="team-comparison-chart-card">
            <div className="team-comparison-section-heading">
              <div>
                <h2>Team Performance Chart</h2>
                <p>Wins, losses, draws and no-result records.</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData}>
                <CartesianGrid
                  stroke="#26364f"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="metric"
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

                <Tooltip contentStyle={tooltipStyle} />
                <Legend />

                <Bar
                  dataKey="team1"
                  name={comparison.team1.name}
                  fill="#38bdf8"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="team2"
                  name={comparison.team2.name}
                  fill="#a78bfa"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="team-comparison-recent-card">
            <div className="team-comparison-section-heading">
              <div>
                <h2>Recent Head-to-Head Matches</h2>
                <p>Latest completed matches between these teams.</p>
              </div>

              <span className="team-comparison-tag">
                Latest 10
              </span>
            </div>

            {comparison.recent_matches.length === 0 ? (
              <div className="team-comparison-empty">
                No completed head-to-head matches found.
              </div>
            ) : (
              <div className="team-comparison-match-list">
                {comparison.recent_matches.map((match) => (
                  <article
                    className="team-comparison-match"
                    key={match.id}
                  >
                    <div className="team-comparison-match-main">
                      <div>
                        <h3>{match.match_name}</h3>
                        <p>
                          {match.team1} vs {match.team2}
                        </p>
                      </div>

                      <span className="team-comparison-match-format">
                        {match.match_format}
                      </span>
                    </div>

                    <div className="team-comparison-match-details">
                      <span>{formatDate(match.match_date)}</span>
                      <span>{match.venue || "Venue unavailable"}</span>
                    </div>

                    <div className="team-comparison-match-result">
                      <span
                        className={`team-result-badge ${match.status.toLowerCase().replace("_", "-")}`}
                      >
                        {match.status.replace("_", " ")}
                      </span>

                      <span>
                        {match.winner
                          ? `${match.winner} won`
                          : match.result || "Result unavailable"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
