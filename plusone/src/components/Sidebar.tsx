import { Link, useLocation, useNavigate } from "react-router-dom";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items = [
    { label: "Home", to: "/home" },
    { label: "My Page", to: "/mypage" },
    { label: "Messages", to: "/messages" },
    { label: "Search", to: "/search" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    onClose();
    navigate("/login");
  };

  return (
    <>
      {/* overlay: click to close */}
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`sidebar-drawer ${isOpen ? "open" : ""}`}
        aria-hidden={!isOpen}
        aria-label="Navigation"
      >
        {/* FULL-HEIGHT three rails */}
        <div className="sidebar-rails">
          <div className="rail" />
          <div className="rail" />
          <div className="rail" />
        </div>

        <nav className="mt-5 pt-2 px-3">
          {items.map((item) => (
            <div key={item.label} className="mb-2">
              <Link
                to={item.to}
                onClick={onClose}
                className={`text-decoration-none fw-bold d-inline-block w-100 py-1 ${
                  pathname === item.to ? "text-warning" : "text-light"
                } sidebar-link`}
              >
                {item.label}
              </Link>
              <div className="sidebar-sep my-2" />
            </div>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-link text-decoration-none fw-bold text-light p-0 mt-1 sidebar-link d-inline-block w-100 text-start"
          >
            Log Out
          </button>
          <div className="sidebar-sep my-2" />
        </nav>
      </aside>
    </>
  );
}