import PageTemplate from "../components/PageTemplate";
import { API_BASE_URL } from "../services/http"; // shared base URL from env/default
import { postService } from "../services/postService";
import { useMemo, useState } from "react";

// Types
// User type
type User = {
  id: string;
  firstName: string;
  lastName: string;
  interests?: string[];
  job?: { title?: string; companyName?: string };
  numConnections?: number;
  profilePhotoUrl?: string;
};

// Post type
type Post = {
  id: string;
  title: string;
  content?: string;
  description?: string;
  category:
    | "EVENTS"
    | "JOB_OPPORTUNITIES"
    | "INTERNSHIPS"
    | "HOUSING"
    | "OTHER";
  author?: { firstName?: string; lastName?: string; id?: string };
  coverImageUrl?: string;
  imageUrl?: string;
  createdAt?: string;
};

type StoredUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
};

// Current search tab - what are we searching for?
type Target = "users" | "events" | "jobs" | "internships" | "housing" | "other";

// Are we searching users by interested or by their name?
type UserMode = "interests" | "name";

// Search React Component
export default function Search() {
  // we store what the user types into the search box
  const [query, setQuery] = useState("");
  // store what filter we are searching by, default is users
  const [target, setTarget] = useState<Target>("users");
  // When searching for users, are we searching by interests or name? default - interests
  const [userMode, setUserMode] = useState<UserMode>("interests");

  // User & Post results as lists
  const [userResults, setUserResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);

  // basic request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false); // <-- track if a search ran

  // current logged-in user (from localStorage)
  const user = useMemo<StoredUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const categoryMap: Record<Exclude<Target, "users">, Post["category"]> = {
    events: "EVENTS",
    jobs: "JOB_OPPORTUNITIES",
    internships: "INTERNSHIPS",
    housing: "HOUSING",
    other: "OTHER",
  };

  const friendlyTargetLabel = (t: Target) =>
    t === "users"
      ? userMode === "name"
        ? "Users (by name)"
        : "Users (by interests)"
      : t === "events"
      ? "Events"
      : t === "jobs"
      ? "Job opportunities"
      : t === "internships"
      ? "Internships"
      : t === "housing"
      ? "Housing"
      : "Other posts";

  // Runs when you submit the form (Enter or button click)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); // don’t reload the page
    const q = query.trim();
    const searchingUsers = target === "users";
    if (!q && searchingUsers) return; // require input only when searching users

    setLoading(true);
    setError("");
    setUserResults([]);
    setPostResults([]);
    setHasSearched(true);

    try {
      // Call your API
      let url: string;
      if (searchingUsers) {
        url = `${API_BASE_URL}/users/search?mode=${userMode}&q=${encodeURIComponent(
          q
        )}&limit=24`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data: User[] = await res.json();
        setUserResults(data);
      } else {
        //searching posts
        const category = categoryMap[target];
        url = `${API_BASE_URL}/posts/search?category=${category}&q=${encodeURIComponent(
          q
        )}&limit=24`;
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          credentials: "include", // <-- send session cookie
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data: Post[] = await res.json();
        setPostResults(data);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false); //clear loading state when finished
    }
  };

  const total = target === "users" ? userResults.length : postResults.length;

  const showEmpty = hasSearched && !loading && !error && total === 0;

  const handleBookmark = async (postId: string) => {
    if (!user?.userId) {
      alert("Please log in to bookmark posts.");
      return;
    }
    try {
      await postService.bookmarkPost(user.userId, postId);
      alert("Post bookmarked! You can see it on your My Page.");
    } catch (err) {
      console.error("Failed to bookmark post", err);
      alert("Failed to bookmark post. Please try again.");
    }
  };

  return (
    <PageTemplate title="Search">
      <form
        onSubmit={handleSearch}
        className="d-flex align-items-center mb-3 flex-wrap"
        style={{ gap: 8 }}
      >
        {/* Target dropdoown */}
        <select
          className="form-select"
          value={target}
          onChange={(e) => setTarget(e.target.value as Target)}
          style={{ maxWidth: 200 }}
        >
          <option value="users">Users</option>
          <option value="events">Events</option>
          <option value="jobs">Job opportunities</option>
          <option value="internships">Internships</option>
          <option value="housing">Housing</option>
          <option value="other">Other posts</option>
        </select>

        {/* Only show when Users is selected */}
        {target === "users" && (
          <select
            className="form-select"
            value={userMode}
            onChange={(e) => setUserMode(e.target.value as UserMode)}
            style={{ maxWidth: 180 }}
          >
            <option value="interests">By interests</option>
            <option value="name">By name</option>
          </select>
        )}

        {/* Query box */}
        <input
          type="text"
          placeholder={
            target === "users"
              ? userMode === "name"
                ? "Search by name…"
                : "Search interests (e.g., concerts, hiking)…"
              : "Optional keywords…"
          }
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 240,
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

      {/* Status */}
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="text-muted">Searching…</div>}

      {/* Header / Empty state */}
      {hasSearched && !loading && !error && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="small text-muted">
            {friendlyTargetLabel(target)}
            {query.trim() ? ` • “${query.trim()}”` : ""}
          </div>
          <div className="small text-muted">
            {total} result{total === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {showEmpty && (
        <div className="alert alert-secondary">
          No matches found in <strong>{friendlyTargetLabel(target)}</strong>
          {query.trim() ? (
            <>
              {" "}
              for “<strong>{query.trim()}</strong>”
            </>
          ) : null}
          . Try a different keyword or filter.
        </div>
      )}

      {/* Results */}
      <div className="row g-3">
        {target === "users" &&
          userResults.map((u) => (
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

        {target !== "users" &&
          postResults.map((p) => {
            const image = p.coverImageUrl || p.imageUrl;
            const blurb = p.content ?? p.description;
            const authorName = [p.author?.firstName, p.author?.lastName]
              .filter(Boolean)
              .join(" ");
            const authorLabel = authorName
              ? `Posted by ${authorName}`
              : "Posted by an unknown user";
            return (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="p-3 border border-2 h-100"
                  style={{ borderColor: "#000" }}
                >
                  {image && (
                    <img
                      src={image}
                      alt={p.title}
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "cover",
                        border: "2px solid #000",
                      }}
                    />
                  )}
                  <div className="mt-2">
                    <div className="fw-bold">{p.title}</div>
                    <div className="small text-muted">{p.category}</div>
                    <div className="small">{authorLabel}</div>
                    {p.createdAt && (
                      <div className="small text-muted">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {blurb && (
                      <p
                        className="mt-2 mb-2"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {blurb}
                      </p>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark mt-1"
                      onClick={() => handleBookmark(p.id)}
                    >
                      ★ Bookmark
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </PageTemplate>
  );
}
