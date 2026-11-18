
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Trophy,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import "./MatchDetails.css";

interface Team {
  id: number;
  name: string;
}

interface Match {
  id: number;
  match_name?: string;
  team1?: number | Team | null;
  team2?: number | Team | null;
  team1_name?: string;
  team2_name?: string;
  format?: string;
  match_format?: string;
  venue?: string;
  match_date?: string;
  status?: string;
  winner_name?: string | null;
  result?: string;
}

function getTeamName(
  team: number | Team | null | undefined,
  fallback?: string
): string {
  if (typeof team === "object" && team !== null) {
    return team.name || fallback || "Unknown Team";
  }

  return fallback || "Unknown Team";
}

function formatMatchDate(date?: string): string {
  if (!date) return "Date not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusClass(status?: string): string {
  const normalized = (status || "upcoming")
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");

  if (["live", "in-progress", "inprogress"].includes(normalized)) {
    return "live";
  }

  if (
    ["completed", "complete", "finished", "resolved"].includes(normalized)
  ) {
    return "completed";
  }

  return "upcoming";
}

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMatch = useCallback(async () => {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      setMatch(null);
      setError("Invalid match ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`matches/${id}/`);
      setMatch(response.data);
    } catch {
      setMatch(null);
      setError("Unable to load match details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  if (loading) {
    return (
      <div className="match-details-page">
        <div className="match-details-message">
          <span className="match-details-spinner" />
          <p>Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="match-details-page">
        <div className="match-details-message match-details-state-card">
          <div className="match-state-icon">
            <Trophy size={28} />
          </div>

          <h2>{error ? "Unable to load match" : "Match not found"}</h2>
          <p>{error || "The requested match could not be found."}</p>

          {error && (
            <button
              type="button"
              className="match-retry-button"
              onClick={fetchMatch}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          )}

          <Link to="/matches" className="match-back-link">
            <ArrowLeft size={16} />
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  const team1Name = getTeamName(match.team1, match.team1_name);
  const team2Name = getTeamName(match.team2, match.team2_name);
  const matchFormat = match.match_format || match.format || "Cricket";
  const matchStatus = match.status || "Upcoming";

  return (
    <div className="match-details-page">
      <div className="match-details-container">
        <Link to="/matches" className="match-back-link">
          <ArrowLeft size={16} />
          Back to Matches
        </Link>

        <section className="match-profile-card">
          <div className="match-profile-header">
            <div className="match-badges">
              <span className="match-format-badge">
                {matchFormat}
              </span>

              <span
                className={`match-status-badge ${getStatusClass(match.status)}`}
              >
                <span className="match-status-dot" />
                {matchStatus}
              </span>
            </div>

            <p className="match-details-eyebrow">MATCH DETAILS</p>

            <h1>
              {match.match_name || `${team1Name} vs ${team2Name}`}
            </h1>
          </div>

          <div className="match-teams">
            <div className="match-team">
              <div className="match-team-icon">
                <Trophy size={28} />
              </div>
              <h2>{team1Name}</h2>
            </div>

            <div className="match-vs">VS</div>

            <div className="match-team">
              <div className="match-team-icon">
                <Trophy size={28} />
              </div>
              <h2>{team2Name}</h2>
            </div>
          </div>

          {match.winner_name && (
            <div className="match-result">
              <Trophy size={20} />
              <div>
                <span>Match Winner</span>
                <strong>{match.winner_name}</strong>
              </div>
            </div>
          )}

          {match.result && (
            <div className="match-result match-result-description">
              <div>
                <span>Match Result</span>
                <strong>{match.result}</strong>
              </div>
            </div>
          )}

          <div className="match-info-grid">
            <div className="match-info-item">
              <CalendarDays size={21} />
              <span>Date</span>
              <strong>{formatMatchDate(match.match_date)}</strong>
            </div>

            <div className="match-info-item">
              <MapPin size={21} />
              <span>Venue</span>
              <strong>{match.venue || "Venue not specified"}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
