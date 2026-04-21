import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getMenus, deleteMenu } from "./menu.api";
import { getMenuTitles } from "../menutitle/menuTitle.api";
import type { MenuItem } from "./menu.types";
import type { MenuTitle } from "../menutitle/menuTitle.types";
import "./view-menu-list.css";
import { useDeleteConfirm } from "../../../../context/DeleteConfirmContext";
import { useSuccessPopup } from "../../../../context/SuccessPopupContext";

const ViewMenuList: React.FC = () => {
    const navigate = useNavigate();
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [titles, setTitles] = useState<MenuTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const [searchParams, setSearchParams] = useSearchParams();
    const urlPage = Number(searchParams.get("page")) || 1;
    const [currentPage, setCurrentPage] = useState(urlPage);
    const { confirmDelete } = useDeleteConfirm();

    // Sync from URL (back button)
    useEffect(() => {
        setCurrentPage(urlPage);
    }, [urlPage]);
    const { showDeleteSuccess } = useSuccessPopup();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [menuRes, titleRes] = await Promise.all([
                    getMenus(),
                    getMenuTitles()
                ]);

                // Extract data from response object if applicable
                const menuList = Array.isArray(menuRes) ? menuRes : (menuRes?.data || []);
                const titleList = Array.isArray(titleRes) ? titleRes : (titleRes?.data || []);

                setMenus(menuList);
                setTitles(titleList);
            } catch (error) {
                console.error("Failed to fetch menu list:", error);
                setMenus([]);
                setTitles([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getTitleName = (id: number) => {
        const title = titles.find(t => t.id === id);
        return title ? title.menu_title : "—";
    };

    const handleDelete = (id: number) => {
        confirmDelete(async () => {
            try {
                await deleteMenu(id);
                setMenus(prev => prev.filter(m => m.id !== id));
                showDeleteSuccess("Menu field has been deleted successfully.", "Deleted Successfully!");
            } catch (error) {
                console.error("Delete failed:", error);
            }
        });
    };

    useEffect(() => {
        setSearchParams({ page: String(currentPage) }, { replace: true });
    }, [currentPage, setSearchParams]);

    // Filter Logic
    const filtered = Array.isArray(menus) ? menus.filter(m => {
        const titleName = getTitleName(m.menu_title_id)?.toLowerCase() || "";
        const pageTitle = m.page_title?.toLowerCase() || "";
        const searchTerm = search.toLowerCase();
        return titleName.includes(searchTerm) || pageTitle.includes(searchTerm);
    }) : [];

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / limit);
    const startIndex = (currentPage - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Safety: Reset current page if out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    return (
        <div className="view-menu-list-container">
            <div className="list-card">
                <div className="list-header-top">
                    <h2>View Menu Page List</h2>
                    <button className="btn-add-new" onClick={() => navigate("/settings/menu/add")}>
                        Add New Menu Page
                    </button>
                </div>

                <div className="list-title-sub">Menu page</div>

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
                                <th style={{ color: "#000", fontWeight: "700" }}>S.NO <span className="sort-icon">⇅</span></th>
                                <th style={{ color: "#000", fontWeight: "700" }}>SUB MENU TITLE <span className="sort-icon">⇅</span></th>
                                <th style={{ color: "#000", fontWeight: "700" }}>STATUS <span className="sort-icon">⇅</span></th>
                                <th style={{ color: "#000", fontWeight: "700", textAlign: "center" }}>ACTION <span className="sort-icon">⇅</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>Loading menus...</td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>No Data Found</td>
                                </tr>
                            ) : (
                                paginated.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{startIndex + index + 1}</td>
                                        <td style={{ fontWeight: "600", color: "#334155" }}>{item.tab_name || item.page_title}</td>
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
                                            <div className="action-buttons" style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => navigate(`/settings/menu/edit/${item.id}?page=${currentPage}`)}
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

                {/* PREMIUM PAGINATION */}
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

                            {totalPages <= 7 ? (
                                [...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))
                            ) : (
                                [...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page} className="pagination-dots" style={{ padding: "0 5px", color: "#6b7280" }}>...</span>;
                                    }
                                    return null;
                                })
                            )}

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

export default ViewMenuList;
