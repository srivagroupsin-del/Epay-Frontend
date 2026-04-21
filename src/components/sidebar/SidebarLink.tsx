import { NavLink } from "react-router-dom";

type Props = {
  to: string;
  label: string;
};

const SidebarLink = ({ to, label }: Props) => {
  return (
    <NavLink
      to={to}
      end={to === "/sector" || to === "/sector-titles" || to === "/subsector" || to === "/categories" || to === "/brands" || to === "/products" || to === "/category-groups" || to === "/settings/menu"}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
};

export default SidebarLink;
