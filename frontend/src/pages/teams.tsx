
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import api from "../services/api";
import "./teams.css";

interface Team {
  id: number;
  name: string;
  short_name: string;
  country: string;
  logo_url?: string;
  player_count?: number;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [failedLogos, setFailedLogos] = useState<number[]>([]);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("teams/");
      const data = response.data;

      const teamList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setTeams(teamList);
      setFailedLogos([]);
    } catch {
      setError("Unable to load teams. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const countries = useMemo(
    () => [
      "All Countries",
      ...Array.from(
        new Set(teams.map((team) => team.country).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [teams]
  );

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        (team.name || "").toLowerCase().includes(query) ||
        (team.short_name || "").toLowerCase().includes(query) ||
        (team.country || "").toLowerCase().includes(query);

      const matchesCountry =
        countryFilter === "All Countries" ||
        team.country === countryFilter;

      return matchesSearch && matchesCountry;
    });
  }, [teams, search, countryFilter]);

  const clearFilters = () => {
    setSearch("");
    setCountryFilter("All Countries");
  };

  const hasActiveFilters =
    search.trim() !== "" || countryFilter !== "All Countries";

  const handleLogoError = (teamId: number) => {
    setFailedLogos((previous) =>
      previous.includes(teamId) ? previous : [...previous, teamId]
    );
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <div>
          <p className="teams-eyebrow">CRICKET DATABASE</p>
          <h1>Teams</h1>
          <p className="teams-subtitle">
            Explore teams and their cricket profiles.
          </p>
        </div>

        <div className="teams-total">
          <span>Total Teams</span>
          <strong>{teams.length}</strong>
        </div>
      </div>

      <div className="teams-toolbar">
        <div className="teams-search-wrap">
          <svg
            className="teams-search-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            type="text"
            className="teams-search-input"
            placeholder="Search teams or countries..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search teams"
          />

          {search && (
            <button
              type="button"
              className="teams-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="teams-country-wrap">
          <label htmlFor="teams-country-filter">Country</label>
          <select
            id="teams-country-filter"
            className="teams-country-select"
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <svg
            className="teams-select-chevron"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <button
          type="button"
          className="teams-clear-button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m19 6-1 14H6L5 6" />
            <path d="M10 10v6M14 10v6" />
          </svg>
          <span>Clear Filters</span>
        </button>
      </div>

      {loading && (
        <div className="teams-message teams-loading">
          <span className="teams-spinner" />
          <span>Loading teams...</span>
        </div>
      )}

      {!loading && error && (
        <div className="teams-message teams-error">
          <p>{error}</p>
          <button
            type="button"
            className="teams-retry-button"
            onClick={fetchTeams}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="teams-results">
            Showing <strong>{filteredTeams.length}</strong> of{" "}
            {teams.length} teams
          </div>

          {filteredTeams.length === 0 ? (
            <div className="teams-empty">
              <h3>No Teams Found</h3>
              <p>No teams match your search or filters.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="teams-retry-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="teams-grid">
              {filteredTeams.map((team) => (
                <Link
                  to={`/teams/${team.id}`}
                  className="team-card"
                  key={team.id}
                  aria-label={`View ${team.name} team profile`}
                >
                  <div className="team-card-top">
                    {team.logo_url && !failedLogos.includes(team.id) ? (
                      <img
                        className="team-logo"
                        src={team.logo_url}
                        alt={`${team.name} logo`}
                        onError={() => handleLogoError(team.id)}
                      />
                    ) : (
                      <div className="team-logo-placeholder">
                        {(team.short_name || team.name || "TEAM")
                          .slice(0, 3)
                          .toUpperCase()}
                      </div>
                    )}

                    <span className="team-short-name">
                      {team.short_name || "TEAM"}
                    </span>
                  </div>

                  <h2>{team.name || "Unnamed Team"}</h2>

                  <p className="team-country">
                    {team.country || "Country not specified"}
                  </p>

                  {typeof team.player_count === "number" && (
                    <div className="team-player-count">
                      <span>Players</span>
                      <strong>{team.player_count}</strong>
                    </div>
                  )}

                  <div className="team-card-footer">
                    <span>Team Profile</span>
                    <span className="team-arrow" aria-hidden="true">
                      →
                    </span>
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
