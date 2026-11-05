import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Players.css";

interface Player {
  id: number;
  name: string;
  country: string;
  role: string;
  batting_style?: string;
  bowling_style?: string;
  team: number;
  team_name?: string;
  photo_url?: string;
}

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("players/")
      .then((response) => {
        const data = response.data;
        setPlayers(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => {
        setError("Unable to load players. Check that the backend is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  const teams = useMemo(
    () => [
      "All Teams",
      ...Array.from(
        new Set(players.map((player) => player.team_name || "Unknown Team"))
      ),
    ],
    [players]
  );

  const roles = useMemo(
    () => [
      "All Roles",
      ...Array.from(
        new Set(players.map((player) => player.role).filter(Boolean))
      ),
    ],
    [players]
  );

  const filteredPlayers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchText) ||
        (player.country || "").toLowerCase().includes(searchText) ||
        (player.team_name || "").toLowerCase().includes(searchText);

      const matchesTeam =
        teamFilter === "All Teams" ||
        (player.team_name || "Unknown Team") === teamFilter;

      const matchesRole =
        roleFilter === "All Roles" || player.role === roleFilter;

      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [players, search, teamFilter, roleFilter]);

  const clearFilters = () => {
    setSearch("");
    setTeamFilter("All Teams");
    setRoleFilter("All Roles");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    teamFilter !== "All Teams" ||
    roleFilter !== "All Roles";

  return (
    <div className="players-page">
      <div className="players-header">
        <div>
          <p className="players-eyebrow">CRICKET DATABASE</p>
          <h1>Players</h1>
          <p className="players-subtitle">
            Explore player profiles across teams and roles.
          </p>
        </div>

        <div className="players-total">
          <span>Total Players</span>
          <strong>{players.length}</strong>
        </div>
      </div>

      <div className="players-toolbar">
        <input
          type="text"
          placeholder="Search players, countries, teams..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search players"
        />

        <select
          value={teamFilter}
          onChange={(event) => setTeamFilter(event.target.value)}
          aria-label="Filter by team"
        >
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="Filter by player role"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="players-clear-button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
      </div>

      {loading && <div className="players-message">Loading players...</div>}

      {error && (
        <div className="players-message players-error">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="players-results">
            Showing <strong>{filteredPlayers.length}</strong> of{" "}
            {players.length} players
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="players-empty">
              No players match your search or filters.
            </div>
          ) : (
            <div className="players-grid">
              {filteredPlayers.map((player) => (
                <Link
                  to={`/players/${player.id}`}
                  className="player-card player-card-link"
                  key={player.id}
                  aria-label={`View ${player.name} profile`}
                >
                  <div className="player-card-top">
                    {player.photo_url ? (
                      <img
                        className="player-photo"
                        src={player.photo_url}
                        alt={player.name}
                      />
                    ) : (
                      <div className="player-avatar">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="player-role">
                      {player.role || "Player"}
                    </span>
                  </div>

                  <div className="player-info">
                    <h2>{player.name}</h2>
                    <p className="player-country">{player.country}</p>

                    <div className="player-team">
                      <span className="team-dot" />
                      {player.team_name || "Team not specified"}
                    </div>
                  </div>

                  <div className="player-details">
                    <div>
                      <span>Batting</span>
                      <strong>{player.batting_style || "—"}</strong>
                    </div>

                    <div>
                      <span>Bowling</span>
                      <strong>{player.bowling_style || "—"}</strong>
                    </div>
                  </div>

                  <div className="player-card-footer">
                    View Profile <span aria-hidden="true">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}