import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

const SidebarSection = ({ title, children }: Props) => {
  return (
    <div className="sidebar-section">
      <h2 className="sidebar-section-title">
        {title}
      </h2>
      <nav className="sidebar-nav">
        {children}
      </nav>
    </div>
  );
};

export default SidebarSection;
