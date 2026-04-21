import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SquarePen, Eye } from "lucide-react";
import { getColours, deleteColour } from "../models/colour.api";
import type { Colour } from "../models/colour.api";
import "./viewColourList.css";

const ViewColourList = () => {
    const navigate = useNavigate();
    const [colours, setColours] = useState<Colour[]>([]);
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
            const data = await getColours();
            setColours(data);
        } catch (err: any) {
            setError(err.message || "Failed to load colours");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this colour?")) return;
        try {
            await deleteColour(id);
            alert("Deleted successfully");
            setColours(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = colours.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
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
                <h2>View Colour List</h2>
                <button
                    className="btn-add-new-colour"
                    onClick={() => navigate("/variant/add-colour")}
                >
                    Add New Colour
                </button>
            </div>

            <div className="view-colour-card">
                <h3>Colour - Master</h3>

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
                                <th>Colour ↕</th>
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
                                currentData.map((c, index) => (
                                    <tr key={c.id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td>{c.name}</td>
                                        <td>
                                            <span className="status-badge">
                                                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-icons">
                                                <button className="btn-icon-edit" onClick={() => navigate(`/variant/edit-colour/${c.id}`)}>
                                                    <SquarePen size={16} />
                                                </button>
                                                <button className="btn-icon-view" onClick={() => handleDelete(c.id)}>
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

export default ViewColourList;
