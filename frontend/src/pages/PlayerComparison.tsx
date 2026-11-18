
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
import "./PlayerComparison.css";

interface Player {
  id: number;
  name: string;
  country?: string;
  role?: string;
  team_name?: string;
  photo_url?: string | null;
}

interface BattingStats {
  innings: number;
  runs: number;
  balls_faced: number;
  not_outs: number;
  dismissals: number;
  average: number | null;
  strike_rate: number | null;
  centuries: number;
  half_centuries: number;
  fours: number;
  sixes: number;
}

interface BowlingStats {
  innings: number;
  overs_bowled: string;
  legal_balls: number;
  runs_conceded: number;
  wickets: number;
  average: number | null;
  economy: number | null;
  strike_rate: number | null;
  maidens: number;
}

interface FieldingStats {
  catches: number;
  run_outs: number;
  stumpings: number;
}

interface PlayerPerformance {
  player: {
    id: number;
    name: string;
    country: string;
    role: string;
    team: string | null;
    photo_url: string | null;
  };
  format: string;
  matches: number;
  batting: BattingStats;
  bowling: BowlingStats;
  fielding: FieldingStats;
}

interface ComparisonResponse {
  player1: PlayerPerformance;
  player2: PlayerPerformance;
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

function formatValue(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
}

function getPlayerList(responseData: any): Player[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  return [];
}

export default function PlayerComparison() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [matchFormat, setMatchFormat] = useState("");

  const [comparison, setComparison] =
    useState<ComparisonResponse | null>(null);

  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");
  const [playersError, setPlayersError] = useState("");

  const loadPlayers = useCallback(async () => {
    setLoadingPlayers(true);
    setPlayersError("");

    try {
      const response = await api.get("players/");
      const playerList = getPlayerList(response.data);

      setPlayers(playerList);
    } catch (err) {
      console.error("Unable to load players:", err);
      setPlayersError("Unable to load players. Check the backend connection.");
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const comparePlayers = async () => {
    setError("");
    setComparison(null);

    if (!player1Id || !player2Id) {
      setError("Please select both players.");
      return;
    }

    if (player1Id === player2Id) {
      setError("Please select two different players.");
      return;
    }

    setComparing(true);

    try {
      const params: Record<string, string> = {
        player1: player1Id,
        player2: player2Id,
      };

      if (matchFormat) {
        params.format = matchFormat;
      }

      const response = await api.get(
        "player_statistics/compare/",
        { params }
      );

      setComparison(response.data);
    } catch (err: any) {
      console.error("Player comparison error:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to compare players. Please try again."
      );
    } finally {
      setComparing(false);
    }
  };

  const battingChartData = useMemo(() => {
    if (!comparison) return [];

    return [
      {
        metric: "Runs",
        player1: comparison.player1.batting.runs,
        player2: comparison.player2.batting.runs,
      },
      {
        metric: "Centuries",
        player1: comparison.player1.batting.centuries,
        player2: comparison.player2.batting.centuries,
      },
      {
        metric: "Half-centuries",
        player1: comparison.player1.batting.half_centuries,
        player2: comparison.player2.batting.half_centuries,
      },
      {
        metric: "Fours",
        player1: comparison.player1.batting.fours,
        player2: comparison.player2.batting.fours,
      },
      {
        metric: "Sixes",
        player1: comparison.player1.batting.sixes,
        player2: comparison.player2.batting.sixes,
      },
    ];
  }, [comparison]);

  const bowlingChartData = useMemo(() => {
    if (!comparison) return [];

    return [
      {
        metric: "Wickets",
        player1: comparison.player1.bowling.wickets,
        player2: comparison.player2.bowling.wickets,
      },
      {
        metric: "Maidens",
        player1: comparison.player1.bowling.maidens,
        player2: comparison.player2.bowling.maidens,
      },
      {
        metric: "Catches",
        player1: comparison.player1.fielding.catches,
        player2: comparison.player2.fielding.catches,
      },
      {
        metric: "Run outs",
        player1: comparison.player1.fielding.run_outs,
        player2: comparison.player2.fielding.run_outs,
      },
      {
        metric: "Stumpings",
        player1: comparison.player1.fielding.stumpings,
        player2: comparison.player2.fielding.stumpings,
      },
    ];
  }, [comparison]);

  const renderPlayerCard = (
    performance: PlayerPerformance,
    label: string
  ) => (
    <article className="comparison-player-card">
      <div className="comparison-player-photo">
        {performance.player.photo_url ? (
          <img
            src={performance.player.photo_url}
            alt={performance.player.name}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>
            {performance.player.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <span className="comparison-player-label">{label}</span>

      <h2>{performance.player.name}</h2>

      <p>
        {performance.player.country || "Country unavailable"}
      </p>

      <div className="comparison-player-meta">
        <span>{performance.player.role || "Role unavailable"}</span>
        <span>{performance.player.team || "No team"}</span>
      </div>

      <div className="comparison-matches">
        <strong>{performance.matches}</strong>
        <span>Matches played</span>
      </div>
    </article>
  );

  const renderMetric = (
    label: string,
    value1: number | null | undefined,
    value2: number | null | undefined,
    lowerIsBetter = false
  ) => {
    const first = value1 ?? 0;
    const second = value2 ?? 0;

    const hasData = value1 !== null && value1 !== undefined &&
      value2 !== null && value2 !== undefined;

    let winner: "player1" | "player2" | "tie" = "tie";

    if (hasData && first !== second) {
      if (lowerIsBetter) {
        winner = first < second ? "player1" : "player2";
      } else {
        winner = first > second ? "player1" : "player2";
      }
    }

    return (
      <div className="comparison-metric-row" key={label}>
        <span
          className={`comparison-metric-value ${
            winner === "player1" ? "metric-winner" : ""
          }`}
        >
          {formatValue(value1)}
        </span>

        <div className="comparison-metric-name">
          <span>{label}</span>
          {winner === "tie" ? (
            <small>{hasData ? "Tie" : "No data"}</small>
          ) : (
            <small>
              {winner === "player1" ? "Player 1 leads" : "Player 2 leads"}
            </small>
          )}
        </div>

        <span
          className={`comparison-metric-value ${
            winner === "player2" ? "metric-winner" : ""
          }`}
        >
          {formatValue(value2)}
        </span>
      </div>
    );
  };

  return (
    <div className="player-comparison-page">
      <header className="comparison-header">
        <div>
          <p className="comparison-eyebrow">CRICKET INSIGHTS</p>
          <h1>Player Comparison</h1>
          <p className="comparison-subtitle">
            Compare player performances across cricket formats.
          </p>
        </div>

        <div className="comparison-header-badge">
          <span />
          Performance Analysis
        </div>
      </header>

      <section className="comparison-selection-card">
        <div className="comparison-section-heading">
          <div>
            <h2>Select Players</h2>
            <p>Choose two players to compare their statistics.</p>
          </div>
        </div>

        {playersError && (
          <div className="comparison-error" role="alert">
            {playersError}
            <button type="button" onClick={loadPlayers}>
              Retry
            </button>
          </div>
        )}

        <div className="comparison-selection-grid">
          <div className="comparison-input-group">
            <label htmlFor="comparison-player-one">Player 1</label>
            <select
              id="comparison-player-one"
              value={player1Id}
              onChange={(event) => {
                setPlayer1Id(event.target.value);
                setComparison(null);
                setError("");
              }}
              disabled={loadingPlayers}
            >
              <option value="">
                {loadingPlayers ? "Loading players..." : "Select Player 1"}
              </option>

              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="comparison-vs">VS</div>

          <div className="comparison-input-group">
            <label htmlFor="comparison-player-two">Player 2</label>
            <select
              id="comparison-player-two"
              value={player2Id}
              onChange={(event) => {
                setPlayer2Id(event.target.value);
                setComparison(null);
                setError("");
              }}
              disabled={loadingPlayers}
            >
              <option value="">
                {loadingPlayers ? "Loading players..." : "Select Player 2"}
              </option>

              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="comparison-actions">
          <div className="comparison-input-group comparison-format-group">
            <label htmlFor="comparison-format">Match Format</label>
            <select
              id="comparison-format"
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
            className="comparison-submit-button"
            onClick={comparePlayers}
            disabled={comparing || loadingPlayers || players.length < 2}
          >
            {comparing ? "Comparing..." : "Compare Players"}
          </button>
        </div>

        {error && (
          <div className="comparison-error" role="alert">
            {error}
          </div>
        )}
      </section>

      {comparison && (
        <div className="comparison-results">
          <section className="comparison-player-grid">
            {renderPlayerCard(comparison.player1, "PLAYER 1")}

            <div className="comparison-center-vs">VS</div>

            {renderPlayerCard(comparison.player2, "PLAYER 2")}
          </section>

          <section className="comparison-stat-card">
            <div className="comparison-section-heading">
              <div>
                <h2>Batting Comparison</h2>
                <p>Batting performance across selected matches.</p>
              </div>
              <span className="comparison-tag">BATTING</span>
            </div>

            <div className="comparison-player-names">
              <span>{comparison.player1.player.name}</span>
              <span>{comparison.player2.player.name}</span>
            </div>

            <div className="comparison-metrics">
              {renderMetric(
                "Matches",
                comparison.player1.matches,
                comparison.player2.matches
              )}
              {renderMetric(
                "Runs",
                comparison.player1.batting.runs,
                comparison.player2.batting.runs
              )}
              {renderMetric(
                "Batting Average",
                comparison.player1.batting.average,
                comparison.player2.batting.average
              )}
              {renderMetric(
                "Strike Rate",
                comparison.player1.batting.strike_rate,
                comparison.player2.batting.strike_rate
              )}
              {renderMetric(
                "Centuries",
                comparison.player1.batting.centuries,
                comparison.player2.batting.centuries
              )}
              {renderMetric(
                "Half-centuries",
                comparison.player1.batting.half_centuries,
                comparison.player2.batting.half_centuries
              )}
              {renderMetric(
                "Fours",
                comparison.player1.batting.fours,
                comparison.player2.batting.fours
              )}
              {renderMetric(
                "Sixes",
                comparison.player1.batting.sixes,
                comparison.player2.batting.sixes
              )}
            </div>
          </section>

          <section className="comparison-stat-card">
            <div className="comparison-section-heading">
              <div>
                <h2>Bowling Comparison</h2>
                <p>Bowling performance across selected matches.</p>
              </div>
              <span className="comparison-tag">BOWLING</span>
            </div>

            <div className="comparison-metrics">
              {renderMetric(
                "Wickets",
                comparison.player1.bowling.wickets,
                comparison.player2.bowling.wickets
              )}
              {renderMetric(
                "Bowling Average",
                comparison.player1.bowling.average,
                comparison.player2.bowling.average,
                true
              )}
              {renderMetric(
                "Economy Rate",
                comparison.player1.bowling.economy,
                comparison.player2.bowling.economy,
                true
              )}
              {renderMetric(
                "Bowling Strike Rate",
                comparison.player1.bowling.strike_rate,
                comparison.player2.bowling.strike_rate,
                true
              )}
              {renderMetric(
                "Runs Conceded",
                comparison.player1.bowling.runs_conceded,
                comparison.player2.bowling.runs_conceded,
                true
              )}
              {renderMetric(
                "Maidens",
                comparison.player1.bowling.maidens,
                comparison.player2.bowling.maidens
              )}
            </div>
          </section>

          <section className="comparison-stat-card">
            <div className="comparison-section-heading">
              <div>
                <h2>Fielding Comparison</h2>
                <p>Fielding contributions by each player.</p>
              </div>
              <span className="comparison-tag">FIELDING</span>
            </div>

            <div className="comparison-metrics">
              {renderMetric(
                "Catches",
                comparison.player1.fielding.catches,
                comparison.player2.fielding.catches
              )}
              {renderMetric(
                "Run Outs",
                comparison.player1.fielding.run_outs,
                comparison.player2.fielding.run_outs
              )}
              {renderMetric(
                "Stumpings",
                comparison.player1.fielding.stumpings,
                comparison.player2.fielding.stumpings
              )}
            </div>
          </section>

          <section className="comparison-charts-grid">
            <article className="comparison-chart-card">
              <div className="comparison-section-heading">
                <div>
                  <h2>Batting Performance</h2>
                  <p>Runs and scoring milestones.</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={battingChartData}>
                  <CartesianGrid
                    stroke="#26364f"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="player1"
                    name={comparison.player1.player.name}
                    fill="#38bdf8"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="player2"
                    name={comparison.player2.player.name}
                    fill="#a78bfa"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </article>

            <article className="comparison-chart-card">
              <div className="comparison-section-heading">
                <div>
                  <h2>Bowling & Fielding</h2>
                  <p>Wickets and fielding contributions.</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={bowlingChartData}>
                  <CartesianGrid
                    stroke="#26364f"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="player1"
                    name={comparison.player1.player.name}
                    fill="#38bdf8"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="player2"
                    name={comparison.player2.player.name}
                    fill="#a78bfa"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </section>
        </div>
      )}
    </div>
  );
}
