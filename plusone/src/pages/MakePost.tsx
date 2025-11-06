import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { postService } from "../services/postService";
import type { Post, Category } from "../types/post";

export default function MakePost() {
  const [navOpen, setNavOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Events");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [eventDate, setEventDate] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { post?: Post } };

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // Prefill if editing
  useEffect(() => {
    if (state?.post) {
      const p = state.post;
      setTitle(p.title);
      setCategory(p.category);
      setDescription(p.description);
      setImageUrl(p.imageUrl || undefined);
      setEventDate(p.eventDate || "");
    }
  }, [state]);

  const handleSelectCategory = (label: Category) => {
    setCategory(label);
    if(label !== "Events") setEventDate("");
  };

  const onFilePick = () => fileInputRef.current?.click();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;

    // TODO: upload file later; for now, just ignore or use a stub URL
    const payload: Post = {
      id: state?.post?.id,
      userId: user.userId,
      title,
      category,
      description,
      imageUrl: imageUrl || undefined,
      eventDate: category === "Events" && eventDate ? eventDate : null,
    };

    if (payload.id) {
      await postService.update(payload.id, payload);
    } else {
      await postService.create(payload);
    }

    navigate("/mypage");
  };

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
      <header className="d-flex align-items-center" style={{ height: 65, background: "#000", paddingLeft: 12, gap: 8 }}>
        <button
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          aria-pressed={navOpen}
          onClick={() => setNavOpen((o) => !o)}
          className="btn btn-link p-0 m-0"
          style={{ lineHeight: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div className={`hamburger ${navOpen ? "open" : ""}`}>
            <span className="line" />
            <span className="line" />
            <span className="line" />
          </div>
        </button>
        <h1 className="h6 text-light mb-0">{state?.post ? "Edit Post" : "Make a post"}</h1>
      </header>

      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="container py-4">
        <form className="vstack gap-3" onSubmit={onSubmit}>
          <div className="post-box">
            <input
              type="text"
              className="form-control form-control-lg border-0 bg-transparent post-input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="post-box">
            <div className="d-flex flex-wrap align-items-center gap-4 px-2 py-1">
              {(["Events", "Job opportunities", "Internships", "Housing", "Other"] as Category[]).map((label) => (
                <label key={label} className="form-check-inline d-flex align-items-center gap-2 m-0">
                  <input
                    type="radio"
                    className="form-check-input"
                    name="category"
                    value={label}
                    checked={category === label}
                    onChange={() => handleSelectCategory(label)}
                  />
                  <span className="post-radio-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="post-box">
            <textarea
              className="form-control border-0 bg-transparent post-textarea"
              placeholder="Description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {category === "Events" && (
            <div className="post-box">
              <label className="form-label mb-1">Event date</label>
              <input
                type="date"
                className="form-control"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required={category === "Events"} 
                min={new Date().toISOString().slice(0,10)}
               />
            </div>
          )}

          <div className="post-box d-flex align-items-center justify-content-between">
            <span className="text-muted ms-2">
              Add files here (photos, flyers, resumes, etc).
              {file ? <strong className="ms-2 text-dark">Selected: {file.name}</strong> : null}
            </span>

            <div className="me-2">
              <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button type="button" className="btn btn-outline-dark btn-sm px-3" onClick={onFilePick}>
                + Upload file
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-dark px-4" style={{ color: "#F2E1C0", fontWeight: "bold" }}>
              {state?.post ? "Save" : "Submit"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
