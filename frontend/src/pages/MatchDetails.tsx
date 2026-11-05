import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Trophy } from "lucide-react";
import api from "../services/api";
import "./MatchDetails.css";

interface Team {
  id: number;
  name: string;
}

interface Match {
  id: number;
  match_name?: string;

  // Supports either nested team objects or team IDs
  team1?: number | Team | null;
  team2?: number | Team | null;

  // Names used by the matches list API
  team1_name?: string;
  team2_name?: string;

  // Supports both field names
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

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`matches/${id}/`);
        setMatch(response.data);
      } catch {
        setError("Unable to load match details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMatch();
    } else {
      setError("Invalid match ID.");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="match-details-message">Loading match...</div>;
  }

  if (error || !match) {
    return (
      <div className="match-details-message">
        <p>{error || "Match not found."}</p>
        <Link to="/matches" className="match-back-link">
          <ArrowLeft size={16} />
          Back to Matches
        </Link>
      </div>
    );
  }

  const team1Name = getTeamName(match.team1, match.team1_name);
  const team2Name = getTeamName(match.team2, match.team2_name);
  const matchFormat = match.match_format || match.format || "Match";

  const formattedDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available";

  return (
    <div className="match-details-page">
      <Link to="/matches" className="match-back-link">
        <ArrowLeft size={16} />
        Back to Matches
      </Link>

      <div className="match-profile-card">
        <div className="match-profile-header">
          <span className="match-format-badge">{matchFormat}</span>

          <span className="match-status-badge">
            {match.status || "Unknown"}
          </span>

          <h1>{match.match_name || `${team1Name} vs ${team2Name}`}</h1>
        </div>

        <div className="match-teams">
          <div className="match-team">
            <Trophy size={28} />
            <h2>{team1Name}</h2>
          </div>

          <span className="match-vs">VS</span>

          <div className="match-team">
            <Trophy size={28} />
            <h2>{team2Name}</h2>
          </div>
        </div>

        {match.winner_name && (
          <div className="match-result">
            <span>Winner</span>
            <strong>{match.winner_name}</strong>
          </div>
        )}

        {match.result && (
          <div className="match-result">
            <span>Match Result</span>
            <strong>{match.result}</strong>
          </div>
        )}

        <div className="match-info-grid">
          <div>
            <CalendarDays size={20} />
            <span>Date</span>
            <strong>{formattedDate}</strong>
          </div>

          <div>
            <MapPin size={20} />
            <span>Venue</span>
            <strong>{match.venue || "Venue not specified"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}