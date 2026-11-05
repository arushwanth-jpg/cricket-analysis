import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./matches.css";

interface Match {
  id: number;
  match_name: string;
  team1_name: string;
  team2_name: string;
  match_format: string;
  venue: string;
  match_date: string;
  status: string;
  winner_name?: string | null;
  result?: string;
}

type DateSort = "newest" | "oldest";

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("All Formats");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateSort, setDateSort] = useState<DateSort>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("matches/")
      .then((response) => {
        const data = response.data;
        setMatches(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => {
        setError("Unable to load matches. Check that the backend is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  const formats = useMemo(
    () => [
      "All Formats",
      ...Array.from(
        new Set(matches.map((match) => match.match_format).filter(Boolean))
      ),
    ],
    [matches]
  );

  const statuses = useMemo(
    () => [
      "All Statuses",
      ...Array.from(
        new Set(matches.map((match) => match.status).filter(Boolean))
      ),
    ],
    [matches]
  );

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = matches.filter((match) => {
      const matchesSearch =
        (match.match_name || "").toLowerCase().includes(query) ||
        (match.team1_name || "").toLowerCase().includes(query) ||
        (match.team2_name || "").toLowerCase().includes(query) ||
        (match.venue || "").toLowerCase().includes(query);

      const matchesFormat =
        formatFilter === "All Formats" ||
        match.match_format === formatFilter;

      const matchesStatus =
        statusFilter === "All Statuses" ||
        match.status === statusFilter;

      return matchesSearch && matchesFormat && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const dateA = a.match_date
        ? new Date(a.match_date).getTime()
        : Number.NaN;
      const dateB = b.match_date
        ? new Date(b.match_date).getTime()
        : Number.NaN;

      // Matches with unknown dates appear after dated matches.
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;

      return dateSort === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [matches, search, formatFilter, statusFilter, dateSort]);

  const clearFilters = () => {
    setSearch("");
    setFormatFilter("All Formats");
    setStatusFilter("All Statuses");
    setDateSort("newest");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    formatFilter !== "All Formats" ||
    statusFilter !== "All Statuses" ||
    dateSort !== "newest";

  const formatDate = (date: string) => {
    if (!date) return "Date TBA";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date TBA";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusClass = (status: string) =>
    (status || "upcoming").toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="matches-page">
      <div className="matches-header">
        <div>
          <p className="matches-eyebrow">MATCH CENTER</p>
          <h1>Matches</h1>
          <p className="matches-subtitle">
            Browse fixtures, results, and match details.
          </p>
        </div>

        <div className="matches-total">
          <span>Total Matches</span>
          <strong>{matches.length}</strong>
        </div>
      </div>

      <div className="matches-toolbar">
        <input
          type="text"
          placeholder="Search teams, matches, venues..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search matches"
        />

        <select
          value={formatFilter}
          onChange={(event) => setFormatFilter(event.target.value)}
          aria-label="Filter by format"
        >
          {formats.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={dateSort}
          onChange={(event) => setDateSort(event.target.value as DateSort)}
          aria-label="Sort matches by date"
        >
          <option value="newest">Date: Newest First</option>
          <option value="oldest">Date: Oldest First</option>
        </select>

        <button
          type="button"
          className="matches-clear-btn"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
      </div>

      {loading && <div className="matches-message">Loading matches...</div>}

      {error && (
        <div className="matches-message matches-error">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="matches-results">
            Showing <strong>{filteredMatches.length}</strong> of{" "}
            {matches.length} matches
          </div>

          {filteredMatches.length === 0 ? (
            <div className="matches-empty">
              No matches match your filters.
            </div>
          ) : (
            <div className="matches-grid">
              {filteredMatches.map((match) => (
                <Link
                  to={`/matches/${match.id}`}
                  className="match-card match-card-link"
                  key={match.id}
                  aria-label={`View ${match.match_name} details`}
                >
                  <div className="match-card-header">
                    <span className="match-format">
                      {match.match_format || "Cricket"}
                    </span>

                    <span
                      className={`match-status ${statusClass(match.status)}`}
                    >
                      {match.status || "Upcoming"}
                    </span>
                  </div>

                  <h2>{match.match_name || "Cricket Match"}</h2>

                  <div className="match-teams">
                    <div className="match-team">
                      <span className="match-team-mark">
                        {(match.team1_name || "T").charAt(0)}
                      </span>
                      <strong>{match.team1_name || "Team 1"}</strong>
                    </div>

                    <span className="match-vs">VS</span>

                    <div className="match-team">
                      <span className="match-team-mark">
                        {(match.team2_name || "T").charAt(0)}
                      </span>
                      <strong>{match.team2_name || "Team 2"}</strong>
                    </div>
                  </div>

                  <div className="match-meta">
                    <span>📅 {formatDate(match.match_date)}</span>
                    <span>📍 {match.venue || "Venue TBA"}</span>
                  </div>

                  {match.winner_name && (
                    <div className="match-result">
                      Winner: <strong>{match.winner_name}</strong>
                    </div>
                  )}

                  {match.result && (
                    <p className="match-result-text">{match.result}</p>
                  )}

                  <div className="match-card-footer">
                    View Match Details <span aria-hidden="true">→</span>
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