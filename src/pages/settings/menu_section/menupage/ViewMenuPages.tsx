import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import "../menu/view-menu-list.css"; // Reuse existing styles

interface MenuPageItem {
  id: number;
  page_title: string;
  link: string;
  itab: string;
  icon_name: string;
  status: "active" | "inactive";
}

const ViewMenuPages: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Start loading true
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<MenuPageItem[]>([]);

  // Default mock data
  const defaultPages: MenuPageItem[] = [
    { id: 1, page_title: "Dashboard", link: "/dashboard", itab: "Main", icon_name: "LayoutDashboard", status: "active" },
    { id: 2, page_title: "Profile", link: "/profile", itab: "User", icon_name: "User", status: "active" },
  ];

  useEffect(() => {
    const storedData = localStorage.getItem("menu_pages_data");
    if (storedData) {
      setPages(JSON.parse(storedData));
    } else {
      // Initialize with default data if empty
      localStorage.setItem("menu_pages_data", JSON.stringify(defaultPages));
      setPages(defaultPages);
    }
    setLoading(false);
  }, []);

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this menu page?")) return;

    const updatedPages = pages.filter(p => p.id !== id);
    setPages(updatedPages);
    localStorage.setItem("menu_pages_data", JSON.stringify(updatedPages));
  };

  const filtered = pages.filter(p =>
    p.page_title.toLowerCase().includes(search.toLowerCase()) ||
    p.link.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return (
    <div className="view-menu-list-container">
      <div className="list-card">
        <div className="list-header-top">
          <h2>View Menu Page List</h2>
          <button className="btn-add-new" onClick={() => navigate("/settings/menu-pages/add")}>
            Add New Menu Page
          </button>
        </div>

        <div className="list-title-sub">Menu page - Master</div>

        <div className="list-controls">
          <div className="show-entries">
            Show
            <select
              className="entries-select"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            entries
          </div>

          <div className="search-wrapper">
            Search:
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="menu-list-table">
            <thead>
              <tr>
                <th style={{ color: "#6366f1", fontWeight: "700" }}>S.NO <span className="sort-icon">⇅</span></th>
                <th style={{ color: "#6366f1", fontWeight: "700" }}>SUB MENU TITLE <span className="sort-icon">⇅</span></th>
                <th style={{ color: "#6366f1", fontWeight: "700" }}>STATUS <span className="sort-icon">⇅</span></th>
                <th style={{ color: "#6366f1", fontWeight: "700" }}>ACTION <span className="sort-icon">⇅</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>Loading pages...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>No Data Found</td>
                </tr>
              ) : (
                paginated.map((item, index) => (
                  <tr key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td style={{ fontWeight: "600", color: "#334155" }}>{item.page_title}</td>
                    <td>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background: item.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: item.status === "active" ? "#166534" : "#991b1b"
                      }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="action-btn edit"
                          onClick={() => navigate(`/settings/menu-pages/edit/${item.id}`)}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#eff6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          title="Edit"
                        >
                          <Pencil size={15} color="#3b82f6" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(item.id)}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          title="Delete"
                        >
                          <Trash2 size={15} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 0 && (
          <div className="pagination-container" style={{ padding: "20px 24px", justifyContent: "space-between", display: "flex", alignItems: "center" }}>
            <div className="pagination-info" style={{ fontSize: "14px", color: "#6b7280" }}>
              Showing {startIndex + 1} to {Math.min(startIndex + limit, filtered.length)} of {filtered.length} entries
            </div>
            <div className="pagination-premium">
              <button
                className="pagination-btn nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronsLeft size={18} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="pagination-btn nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewMenuPages;
