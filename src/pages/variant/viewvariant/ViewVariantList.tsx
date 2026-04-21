import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SquarePen, Eye } from "lucide-react";
import { getVariants, deleteVariant } from "../models/variant.api";
import type { Variant } from "../models/variant.api";
import "../viewcolour/viewColourList.css"; // Reuse existing styles

const ViewVariantList = () => {
    const navigate = useNavigate();
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getVariants();
            setVariants(data);
        } catch (err: any) {
            setError(err.message || "Failed to load variants");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this variant?")) return;
        try {
            await deleteVariant(id);
            alert("Deleted successfully");
            setVariants(prev => prev.filter(v => v.id !== id));
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = variants.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination logic
    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="view-colour-container">
            <div className="view-colour-header">
                <h2>View Variant List</h2>
                <button
                    className="btn-add-new-colour"
                    onClick={() => navigate("/variant/add-variant")}
                >
                    Add New Variant
                </button>
            </div>

            <div className="view-colour-card">
                <h3>Variant - Master</h3>

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
                                <th># ↕</th>
                                <th>Variant ↕</th>
                                <th>Status ↕</th>
                                <th>Action ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center" }}>
                                        No data found
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((v, index) => (
                                    <tr key={v.id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td>{v.name}</td>
                                        <td>
                                            <span className="status-badge">
                                                {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-icons">
                                                <button className="btn-icon-edit" onClick={() => navigate(`/variant/edit-variant/${v.id}`)}>
                                                    <SquarePen size={16} />
                                                </button>
                                                <button className="btn-icon-view" onClick={() => handleDelete(v.id)}>
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

export default ViewVariantList;
