import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import api from "../services/api";
import "./TeamDetails.css";

interface Team {
  id: number;
  name: string;
  country?: string;
  short_name?: string;
  logo_url?: string;
  players?: Player[];
}

interface Player {
  id: number;
  name: string;
  country: string;
  role: string;
  batting_style?: string;
  bowling_style?: string;
}

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const [teamResponse, playersResponse] = await Promise.all([
          api.get(`teams/${id}/`),
          api.get("players/"),
        ]);

        const teamData = teamResponse.data;
        const playerData = playersResponse.data;
        const allPlayers = Array.isArray(playerData)
          ? playerData
          : playerData.results ?? [];

        setTeam(teamData);
        setPlayers(
          allPlayers.filter(
            (player: Player & { team: number | { id: number } }) =>
              typeof player.team === "number"
                ? player.team === Number(id)
                : player.team?.id === Number(id)
          )
        );
      } catch {
        setError("Unable to load team details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTeamDetails();
    }
  }, [id]);

  if (loading) {
    return <div className="team-details-message">Loading team...</div>;
  }

  if (error || !team) {
    return (
      <div className="team-details-message">
        <p>{error || "Team not found."}</p>
        <Link to="/teams" className="team-back-link">
          <ArrowLeft size={16} /> Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="team-details-page">
      <Link to="/teams" className="team-back-link">
        <ArrowLeft size={16} /> Back to Teams
      </Link>

      <div className="team-profile-card">
        <div className="team-profile-header">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="team-logo" />
          ) : (
            <div className="team-logo-placeholder">
              {team.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <p className="team-details-eyebrow">TEAM PROFILE</p>
            <h1>{team.name}</h1>
            <p>{team.country || "Country not specified"}</p>
            {team.short_name && (
              <span className="team-short-name">{team.short_name}</span>
            )}
          </div>
        </div>

        <div className="team-squad-heading">
          <div>
            <h2>Squad</h2>
            <p>Players registered under this team</p>
          </div>
          <span className="team-player-count">
            <Users size={16} /> {players.length} Players
          </span>
        </div>

        {players.length === 0 ? (
          <div className="team-no-players">No players found for this team.</div>
        ) : (
          <div className="team-squad-grid">
            {players.map((player) => (
              <Link
                to={`/players/${player.id}`}
                className="team-player-card"
                key={player.id}
              >
                <div className="team-player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="team-player-info">
                  <h3>{player.name}</h3>
                  <p>{player.country}</p>
                  <span>{player.role || "Player"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}