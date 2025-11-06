import PageTemplate from "../components/PageTemplate";
import { useState } from "react"; // store user enteried search query

// 1) A tiny type so TS knows what comes back from the server
type User = {
  id: string;
  firstName: string;
  lastName: string;
  interests?: string[];
  job?: { title?: string; companyName?: string };
  numConnections?: number;
  profilePhotoUrl?: string;
};

// 2) Where your backend lives (change if needed)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function Search() {
  // what the user typed
  const [query, setQuery] = useState("");
  // results from the server
  const [results, setResults] = useState<User[]>([]);
  // basic request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3) Runs when you submit the form (Enter or button click)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); // don’t reload the page
    const q = query.trim();
    if (!q) return; // ignore empty searches

    setLoading(true);
    setError("");
    setResults([]);

    try {
      // 4) Call your API: GET /api/users/search?q=...
      const res = await fetch(
        `${API_BASE_URL}/users/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) {
        throw new Error(`Search failed (${res.status})`);
      }
      const data: User[] = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate title="Search">
      <form
        onSubmit={handleSearch}
        className="d-flex align-items-center mb-4"
        style={{ gap: 8 }}
      >
        <input
          type="text"
          placeholder="Search people, posts, events..."
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            border: "2px solid #000",
            borderRadius: 4,
            padding: "8px 12px",
          }}
        />
        <button
          type="submit"
          className="btn btn-dark"
          style={{ background: "#000", color: "#fff" }}
        >
          Search
        </button>
      </form>

      {/* Simple results grid */}
      <div className="row g-3">
        {results.map((u) => (
          <div key={u.id} className="col-12 col-md-6 col-lg-4">
            <div
              className="p-3 border border-2"
              style={{ borderColor: "#000" }}
            >
              <div className="d-flex align-items-center gap-3">
                <img
                  src={u.profilePhotoUrl || "https://placehold.co/64x64"}
                  alt={`${u.firstName} ${u.lastName}`}
                  width={64}
                  height={64}
                  style={{
                    borderRadius: "50%",
                    border: "2px solid #000",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <div className="fw-bold">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="small text-muted">
                    {u.job?.title || "—"}
                    {u.job?.companyName ? ` @ ${u.job.companyName}` : ""}
                  </div>
                  <div className="small mt-1">
                    <strong>Connections:</strong> {u.numConnections ?? 0}
                  </div>
                </div>
              </div>

              {!!(u.interests && u.interests.length) && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {u.interests.map((tag) => (
                    <span
                      key={tag}
                      className="badge text-bg-light"
                      style={{ border: "1px solid #000", fontWeight: 500 }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageTemplate>
  );
}
