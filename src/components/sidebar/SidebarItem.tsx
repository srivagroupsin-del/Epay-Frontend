import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  label: string;
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "featured";
};

const SidebarItem = ({
  label,
  open,
  onToggle,
  children,
  icon: Icon,
  variant = "default"
}: Props) => {
  return (
    <div className={`sidebar-item ${open ? "is-open" : ""} ${variant}`}>
      <Link to="#" onClick={onToggle} className="sidebar-item-trigger">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {Icon && (
            <div className="icon-wrapper">
              <Icon size={18} />
            </div>
          )}
          <span className="sidebar-item-label">{label}</span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown size={16} className="chevron" />
        </motion.div>
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="submenu-wrapper"
          >
            <div className="submenu-content">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarItem;
