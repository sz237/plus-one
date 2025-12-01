import PageTemplate from "../components/PageTemplate";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "../services/http"; // shared base URL from env/default
import { postService } from "../services/postService";
import { connectionService } from "../services/connectionService";
import ConnectPopup from "../components/ConnectPopup";
import { useEffect, useMemo, useState } from "react";
import type { ProfileResponse } from "../types/profile";

// Types
// User type
type User = {
  id: string;
  userId?: string; // fallback in case API returns userId
  firstName: string;
  lastName: string;
  interests?: string[];
  job?: { title?: string; companiesName?: string };
  numConnections?: number;
  profilePhotoUrl?: string;
  location?: { city?: string; state?: string; country?: string };
  lookingForRoommate?: boolean | null;
};

// Post type
type Post = {
  id: string;
  title: string;
  content?: string;
  description?: string;
  userId?: string;
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
  eventDate?: string | null;
  eventTime?: string | null;
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
type UserMode = "interests" | "name" | "roommate";

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
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>(
    {}
  );
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

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
        : userMode === "roommate"
        ? "Users (roommates by location)"
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

  const isImageAttachment = (url?: string) => {
    if (!url) return false;
    const normalized = url.split("?")[0].toLowerCase();
    return (
      normalized.startsWith("data:image/") ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(normalized)
    );
  };

  const openAttachment = (url?: string) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const formatEventDateTime = (date?: string | null, time?: string | null) => {
    if (!date) return "";
    const dateStr = new Date(date).toLocaleDateString();
    const timeStr = time ? time.slice(0, 5) : "";
    return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
  };

  const locationMatchesQuery = (location: User["location"], q: string) => {
    if (!location) return false;
    const queryLower = q.toLowerCase();
    return [location.city, location.state, location.country].some((part) =>
      part ? part.toLowerCase().includes(queryLower) : false
    );
  };

  const openAuthorProfile = async (authorId?: string) => {
    if (!authorId) return;
    try {
      setProfileLoading(true);
      setProfileError("");
      const profile = await postService.getProfile(authorId);
      setSelectedProfile(profile);
    } catch (err) {
      console.error(err);
      setProfileError("Failed to load profile.");
      setSelectedProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Pull existing bookmarks so we can mark results as already saved
  useEffect(() => {
    let cancelled = false;
    const loadBookmarks = async () => {
      if (!user?.userId) {
        setBookmarkedIds(new Set());
        return;
      }
      try {
        const bookmarked = await postService.getBookmarkedPosts(user.userId);
        if (cancelled) return;
        setBookmarkedIds(new Set(bookmarked.map((p) => p.id!).filter(Boolean)));
      } catch (err) {
        console.error("Failed to load bookmarked posts", err);
      }
    };
    loadBookmarks();
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

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
        const token = localStorage.getItem(AUTH_TOKEN_KEY); // JWT
        const res = await fetch(url, {
          credentials: "include", // send session cookie
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data: User[] = await res.json();
        const filteredUsers =
          userMode === "roommate"
            ? data.filter(
                (u) =>
                  u.lookingForRoommate &&
                  (q ? locationMatchesQuery(u.location, q) : true)
              )
            : data;
        setUserResults(filteredUsers);
      } else {
        //searching posts
        const category = categoryMap[target];
        url = `${API_BASE_URL}/posts/search?category=${category}&q=${encodeURIComponent(
          q
        )}&limit=24`;
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(url, {
          credentials: "include", // send session cookie
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data: Post[] = await res.json();
        const filtered = data.filter(
          (p) => !user?.userId || (p.userId !== user.userId && p.author?.id !== user.userId)
        );
        setPostResults(filtered);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false); //clear loading state when finished
    }
  };

  // Load connection statuses for displayed users so we can show proper buttons
  useEffect(() => {
    if (!user?.userId || userResults.length === 0) {
      setConnectionStatuses({});
      return;
    }

    let cancelled = false;
    const loadStatuses = async () => {
      const entries = await Promise.all(
        userResults.map(async (u) => {
          const userId = u.id || u.userId;
          if (!userId || userId === user.userId) return [userId, "SELF"] as const;
          try {
            const status = await connectionService.getConnectionStatus(
              user.userId,
              userId
            );
            return [userId, status || "CONNECT"] as const;
          } catch (err) {
            console.error("Failed to load connection status", err);
            return [userId, "CONNECT"] as const;
          }
        })
      );
      if (cancelled) return;
      const next: Record<string, string> = {};
      entries.forEach(([id, status]) => {
        if (id) next[id] = status;
      });
      setConnectionStatuses(next);
    };

    loadStatuses();
    return () => {
      cancelled = true;
    };
  }, [user?.userId, userResults]);

  const total = target === "users" ? userResults.length : postResults.length;

  const showEmpty = hasSearched && !loading && !error && total === 0;

  const handleBookmarkToggle = async (postId: string) => {
    if (!user?.userId) {
      alert("Please log in to bookmark posts.");
      return;
    }
    const isBookmarked = bookmarkedIds.has(postId);
    try {
      if (isBookmarked) {
        await postService.unbookmarkPost(user.userId, postId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await postService.bookmarkPost(user.userId, postId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
        alert("Post bookmarked! You can see it on your My Page.");
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
      alert("Failed to update bookmark. Please try again.");
    }
  };

  const handleConnectClick = (u: User) => {
    if (!user?.userId) {
      alert("Please log in to connect with people.");
      return;
    }
    if (user.userId === u.id || user.userId === u.userId) {
      return;
    }
    setSelectedUser(u);
    setShowConnectPopup(true);
  };

  const markPending = (userId: string) => {
    setConnectionStatuses((prev) => ({ ...prev, [userId]: "PENDING" }));
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
            <option value="roommate">Looking for roommate</option>
          </select>
        )}

        {/* Query box */}
        <input
          type="text"
          placeholder={
            target === "users"
              ? userMode === "name"
                ? "Search by name…"
                : userMode === "roommate"
                ? "Search city, state, or country for roommates…"
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
          userResults.map((u) => {
            const userId = u.id || u.userId;
            const status = userId
              ? connectionStatuses[userId] || "CONNECT"
              : "CONNECT";
            const isSelf = !!(userId && user?.userId === userId);
            const buttonLabel = !user?.userId
              ? "Log in to connect"
              : isSelf
              ? "This is you"
              : status === "FRIENDS"
              ? "Friends"
              : status === "PENDING"
              ? "Pending"
              : "Connect";
            const buttonClass =
              status === "FRIENDS"
                ? "btn btn-success btn-sm"
                : status === "PENDING"
                ? "btn btn-warning btn-sm text-dark"
                : "btn btn-outline-dark btn-sm";
            const buttonDisabled =
              !user?.userId ||
              isSelf ||
              status === "FRIENDS" ||
              status === "PENDING";

            return (
              <div key={u.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="p-3 border border-2 h-100 d-flex flex-column"
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
                        {u.job?.companiesName
                          ? ` @ ${u.job.companiesName}`
                          : ""}
                      </div>
                      <div className="small mt-1">
                        <strong>Connections:</strong> {u.numConnections ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => handleConnectClick(u)}
                      disabled={buttonDisabled}
                    >
                      {buttonLabel}
                    </button>
                    {status === "FRIENDS" && (
                      <span className="small text-success fw-semibold">
                        Connected
                      </span>
                    )}
                    {status === "PENDING" && (
                      <span className="small text-muted">Request sent</span>
                    )}
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
            );
          })}

        {target !== "users" &&
          postResults.map((p) => {
            const image = p.coverImageUrl || p.imageUrl;
            const blurb = p.content ?? p.description;
            const authorName = [p.author?.firstName, p.author?.lastName]
              .filter(Boolean)
              .join(" ");
            const hasImagePreview = isImageAttachment(image);
            const isBookmarked = bookmarkedIds.has(p.id);
            return (
              <div key={p.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="p-3 border border-2 h-100"
                  style={{ borderColor: "#000" }}
                >
                  {image &&
                    (hasImagePreview ? (
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
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark w-100"
                        onClick={() => openAttachment(image)}
                      >
                        View attachment
                      </button>
                    ))}
                  <div className="mt-2">
                    <div className="fw-bold">{p.title}</div>
                    <div className="small text-muted">{p.category}</div>
                    <div className="small">
                      {authorName ? (
                        <>
                          Posted by{" "}
                          <button
                            type="button"
                            className="btn btn-link p-0 align-baseline"
                            onClick={() => openAuthorProfile(p.author?.id)}
                          >
                            {authorName}
                          </button>
                        </>
                      ) : (
                        "Posted by an unknown user"
                      )}
                    </div>
                    {p.createdAt && (
                      <div className="small text-muted">
                        Date posted: {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {p.category === "EVENTS" && p.eventDate && (
                      <div className="small text-muted">
                        Event date: {formatEventDateTime(p.eventDate, p.eventTime)}
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
                      className={`btn btn-sm mt-1 ${isBookmarked ? "" : "btn-outline-dark"}`}
                      style={
                        isBookmarked
                          ? { backgroundColor: "#F2E1C0", color: "#000", borderColor: "#000", fontWeight: 700 }
                          : undefined
                      }
                      onClick={() => handleBookmarkToggle(p.id)}
                    >
                      ★ {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {selectedUser && user?.userId && (
        <ConnectPopup
          isOpen={showConnectPopup}
          onClose={() => setShowConnectPopup(false)}
          targetUser={{
            userId: selectedUser.id || selectedUser.userId || "",
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
          }}
          currentUserId={user.userId}
          onSuccess={() => {
            const selectedId = selectedUser.id || selectedUser.userId;
            if (selectedId) markPending(selectedId);
          }}
        />
      )}

      {(selectedProfile || profileLoading || profileError) && (
        <div
          role="dialog"
          aria-modal="true"
          className="d-flex align-items-center justify-content-center"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1050,
            padding: "16px",
          }}
        >
          <div
            className="bg-white border border-2"
            style={{ borderColor: "#000", maxWidth: 500, width: "100%", borderRadius: 8 }}
          >
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <div className="fw-bold">User Profile</div>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => {
                  setSelectedProfile(null);
                  setProfileError("");
                }}
              >
                ×
              </button>
            </div>

            <div className="p-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {profileLoading ? (
                <div className="text-muted">Loading…</div>
              ) : profileError ? (
                <div className="alert alert-danger mb-0">{profileError}</div>
              ) : selectedProfile ? (
                <div className="vstack gap-2">
                  <div className="fw-bold">
                    {selectedProfile.firstName} {selectedProfile.lastName}
                  </div>
                  {selectedProfile.profile?.job?.title && (
                    <div>
                      <strong>Title:</strong> {selectedProfile.profile.job.title}
                      {selectedProfile.profile.job.companiesName
                        ? ` @ ${selectedProfile.profile.job.companiesName}`
                        : ""}
                    </div>
                  )}
                  {selectedProfile.profile?.interests?.length ? (
                    <div className="d-flex flex-wrap gap-2">
                      {selectedProfile.profile.interests.map((i) => (
                        <span
                          key={i}
                          className="badge text-bg-light"
                          style={{ border: "1px solid #000", fontWeight: 500 }}
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="small text-muted">
                    Connections: {selectedProfile.connectionsCount} • Posts: {selectedProfile.postsCount}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
