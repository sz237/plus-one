import { useState, type PropsWithChildren } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

type ShellProps = {
  title: string;
  rightSlot?: React.ReactNode;
};

export default function Shell({
  title,
  children,
}: PropsWithChildren<ShellProps>) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
      <Header
        title={title}
        isNavOpen={navOpen}
        onToggleNav={() => setNavOpen((o) => !o)}
      />

      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="container py-4">{children}</main>
    </div>
  );
}
