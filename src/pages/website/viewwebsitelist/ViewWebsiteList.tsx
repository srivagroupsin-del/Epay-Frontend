import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SquarePen, Eye } from "lucide-react";
import { getWebsites, deleteWebsite } from "../models/website.api";
import type { Website } from "../models/website.api";
import "./viewWebsiteList.css";

const ViewWebsiteList = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlPage = Number(searchParams.get("page")) || 1;

    const [websites, setWebsites] = useState<Website[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(urlPage);

    /* ======================
       URL PERSISTENCE
    ====================== */
    useEffect(() => {
        setSearchParams({ page: String(currentPage) }, { replace: true });
    }, [currentPage, setSearchParams]);


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getWebsites();
            setWebsites(data);
        } catch (err: any) {
            setError(err.message || "Failed to load websites");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this website?")) return;
        try {
            await deleteWebsite(id);
            alert("Deleted successfully");
            setWebsites(prev => prev.filter(w => w.id !== id));
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = websites.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.url.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination logic
    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="view-website-container">
            <div className="view-website-header">
                <h2>View Website List</h2>
                <button
                    className="btn-add-new-website"
                    onClick={() => navigate("/website/add")}
                >
                    Add New Website
                </button>
            </div>

            <div className="view-website-card">
                <h3>Website - Master</h3>

                <div className="table-controls-top">
                    <div className="entries-control">
                        Show
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        entries
                    </div>

                    <div className="search-control">
                        Search:
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th># </th>
                                <th>Website ↕</th>
                                <th>Sector Field ↕</th>
                                <th>Title ↕</th>
                                <th>Status ↕</th>
                                <th>Action ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center" }}>
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((w, index) => (
                                    <tr key={w.id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td>{w.name}</td>
                                        <td>{w.sector_name ?? "—"}</td>
                                        <td>{w.title ?? "—"}</td>
                                        <td>
                                            <span className="status-badge">
                                                {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-icons">
                                                <button className="btn-icon-edit" onClick={() => navigate(`/website/edit/${w.id}?page=${currentPage}`)}>
                                                    <SquarePen size={16} />
                                                </button>
                                                <button className="btn-icon-view" onClick={() => handleDelete(w.id)}>
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <div className="info-text">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalEntries)} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                    </div>

                    <div className="pagination-controls">
                        <button
                            className="btn-page-nav"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            className="btn-page-nav"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="page-number">{currentPage}</div>
                        <button
                            className="btn-page-nav"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            className="btn-page-nav"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(totalPages)}
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewWebsiteList;
