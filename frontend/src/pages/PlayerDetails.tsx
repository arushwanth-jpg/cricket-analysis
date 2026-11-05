import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, UserRound } from "lucide-react";
import api from "../services/api";
import "./PlayerDetails.css";

interface Team {
  id: number;
  name: string;
}

interface Player {
  id: number;
  name: string;
  country?: string;
  role?: string;
  batting_style?: string;
  bowling_style?: string;
  team?: Team | number | null;
  team_name?: string;
  photo_url?: string | null;
}

function getTeamName(
  team: Team | number | null | undefined,
  fallback?: string
): string {
  if (typeof team === "object" && team !== null) {
    return team.name || fallback || "Unassigned";
  }

  return fallback || "Unassigned";
}

export default function PlayerDetails() {
  const { id } = useParams<{ id: string }>();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlayer = useCallback(async () => {
    if (!id) {
      setError("Invalid player ID.");
      setPlayer(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`players/${id}/`);
      setPlayer(response.data);
    } catch {
      setPlayer(null);
      setError("Unable to load player details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  if (loading) {
    return (
      <div className="player-details-page">
        <div className="player-details-message">
          <div className="player-loading-spinner" />
          <p>Loading player details...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="player-details-page">
        <div className="player-details-message player-details-state-card">
          <div className="player-state-icon">
            <UserRound size={28} />
          </div>

          <h2>{error ? "Unable to load player" : "Player not found"}</h2>
          <p>{error || "The requested player could not be found."}</p>

          {error && (
            <button
              type="button"
              className="player-retry-button"
              onClick={fetchPlayer}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          )}

          <Link to="/players" className="player-back-link">
            <ArrowLeft size={16} />
            Back to Players
          </Link>
        </div>
      </div>
    );
  }

  const teamName = getTeamName(player.team, player.team_name);

  return (
    <div className="player-details-page">
      <div className="player-details-container">
        <Link to="/players" className="player-back-link">
          <ArrowLeft size={16} />
          Back to Players
        </Link>

        <section className="player-profile-card">
          <div className="player-profile-header">
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={`${player.name || "Player"} profile`}
                className="player-profile-photo"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="player-profile-placeholder">
                <UserRound size={48} />
              </div>
            )}

            <div className="player-profile-heading">
              <span className="player-profile-label">PLAYER PROFILE</span>
              <h1>{player.name || "Player Details"}</h1>
              <p className="player-profile-country">
                {player.country || "Country not specified"}
              </p>
              <span className="player-role-badge">
                {player.role || "Role not specified"}
              </span>
            </div>
          </div>

          <div className="player-profile-details">
            <div className="player-detail-item">
              <span className="player-detail-label">Team</span>
              <strong>{teamName}</strong>
            </div>

            <div className="player-detail-item">
              <span className="player-detail-label">Batting Style</span>
              <strong>{player.batting_style || "Not specified"}</strong>
            </div>

            <div className="player-detail-item">
              <span className="player-detail-label">Bowling Style</span>
              <strong>{player.bowling_style || "Not specified"}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}