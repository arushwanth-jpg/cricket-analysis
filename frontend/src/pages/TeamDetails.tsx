
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";
import api from "../services/api";
import "./TeamDetails.css";

interface Team {
  id: number;
  name: string;
  country?: string;
  short_name?: string;
  logo_url?: string;
}

interface Player {
  id: number;
  name: string;
  country?: string;
  role?: string;
  batting_style?: string;
  bowling_style?: string;
  team?: number | { id: number } | null;
}

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);

  const fetchTeamDetails = useCallback(async () => {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      setError("Invalid team ID.");
      setTeam(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [teamResponse, playersResponse] = await Promise.all([
        api.get(`teams/${id}/`),
        api.get("players/"),
      ]);

      const teamData = teamResponse.data;
      const playerData = playersResponse.data;

      const allPlayers: Player[] = Array.isArray(playerData)
        ? playerData
        : Array.isArray(playerData?.results)
          ? playerData.results
          : [];

      setTeam(teamData);

      const filteredPlayers = allPlayers.filter((player) => {
        if (typeof player.team === "number") {
          return player.team === Number(id);
        }

        if (typeof player.team === "object" && player.team !== null) {
          return player.team.id === Number(id);
        }

        return false;
      });

      setPlayers(filteredPlayers);
      setLogoFailed(false);
    } catch {
      setTeam(null);
      setPlayers([]);
      setError("Unable to load team details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  if (loading) {
    return (
      <div className="team-details-page">
        <div className="team-details-message">
          <span className="team-details-spinner" />
          <p>Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="team-details-page">
        <div className="team-details-message team-details-state-card">
          <div className="team-state-icon">
            <Users size={28} />
          </div>

          <h2>{error ? "Unable to load team" : "Team not found"}</h2>
          <p>{error || "The requested team could not be found."}</p>

          {error && (
            <button
              type="button"
              className="team-retry-button"
              onClick={fetchTeamDetails}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          )}

          <Link to="/teams" className="team-back-link">
            <ArrowLeft size={16} />
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  const teamInitials = (team.short_name || team.name || "TEAM")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="team-details-page">
      <div className="team-details-container">
        <Link to="/teams" className="team-back-link">
          <ArrowLeft size={16} />
          Back to Teams
        </Link>

        <div className="team-profile-card">
          <div className="team-profile-header">
            {team.logo_url && !logoFailed ? (
              <img
                src={team.logo_url}
                alt={`${team.name} logo`}
                className="team-details-logo"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="team-details-logo-placeholder">
                {teamInitials}
              </div>
            )}

            <div className="team-profile-heading">
              <p className="team-details-eyebrow">TEAM PROFILE</p>
              <h1>{team.name || "Unnamed Team"}</h1>
              <p>{team.country || "Country not specified"}</p>

              {team.short_name && (
                <span className="team-details-short-name">
                  {team.short_name}
                </span>
              )}
            </div>
          </div>

          <div className="team-squad-heading">
            <div>
              <h2>Squad</h2>
              <p>Players registered under this team</p>
            </div>

            <span className="team-player-count">
              <Users size={17} />
              {players.length} Players
            </span>
          </div>

          {players.length === 0 ? (
            <div className="team-no-players">
              <Users size={30} />
              <h3>No Players Found</h3>
              <p>No players are currently registered under this team.</p>
            </div>
          ) : (
            <div className="team-squad-grid">
              {players.map((player) => (
                <Link
                  to={`/players/${player.id}`}
                  className="team-player-card"
                  key={player.id}
                  aria-label={`View ${player.name} profile`}
                >
                  <div className="team-player-avatar">
                    {(player.name || "P").charAt(0).toUpperCase()}
                  </div>

                  <div className="team-player-info">
                    <h3>{player.name || "Unknown Player"}</h3>
                    <p>{player.country || "Country not specified"}</p>
                    <span>{player.role || "Player"}</span>
                  </div>

                  <span className="team-player-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
