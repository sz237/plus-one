type HeaderProps = {
  title: string;
  isNavOpen: boolean;
  onToggleNav: () => void;
};

export default function Header({ title, isNavOpen, onToggleNav }: HeaderProps) {
  return (
    <header
      className="d-flex align-items-center"
      style={{ height: 65, background: "#000", paddingLeft: 12, gap: 8 }}
    >
      <button
        aria-label="Toggle navigation"
        aria-expanded={isNavOpen}
        onClick={onToggleNav}
        className="btn btn-link p-0 m-0"
        style={{
          lineHeight: 0,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className={`hamburger ${isNavOpen ? "open" : ""}`}>
          <span className="line" />
          <span className="line" />
          <span className="line" />
        </span>
      </button>

      <h1 className="h6 text-light mb-0">{title}</h1>
    </header>
  );
}
