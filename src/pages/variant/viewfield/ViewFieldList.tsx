import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SquarePen, Eye } from "lucide-react";
import { getFields, deleteField } from "../models/field.api";
import type { Field } from "../models/field.api";
import "../viewcolour/viewColourList.css";

const ViewFieldList = () => {
    const navigate = useNavigate();
    const [fields, setFields] = useState<Field[]>([]);
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
            const data = await getFields();
            setFields(data);
        } catch (err: any) {
            setError(err.message || "Failed to load fields");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this field?")) return;
        try {
            await deleteField(id);
            alert("Deleted successfully");
            setFields(prev => prev.filter(f => f.id !== id));
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const filtered = fields.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="view-colour-container">
            <div className="view-colour-header">
                <h2>View Field List</h2>
                <button className="btn-add-new-colour" onClick={() => navigate("/variant/add-field")}>
                    Add New Field
                </button>
            </div>

            <div className="view-colour-card">
                <h3>Field - Master</h3>
                <div className="table-controls-top">
                    <div className="entries-control">
                        Show
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        entries
                    </div>
                    <div className="search-control">
                        Search:
                        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="redesign-table">
                        <thead>
                            <tr>
                                <th># ↕</th>
                                <th>Field ↕</th>
                                <th>Status ↕</th>
                                <th>Action ↕</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: "center" }}>No data found</td></tr>
                            ) : (
                                currentData.map((f, index) => (
                                    <tr key={f.id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td>{f.name}</td>
                                        <td><span className="status-badge">{f.status}</span></td>
                                        <td>
                                            <div className="action-icons">
                                                <button className="btn-icon-edit" onClick={() => navigate(`/variant/edit-field/${f.id}`)}><SquarePen size={16} /></button>
                                                <button className="btn-icon-view" onClick={() => handleDelete(f.id)}><Eye size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <div className="info-text">Showing {Math.min((currentPage - 1) * pageSize + 1, totalEntries)} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries</div>
                    <div className="pagination-controls">
                        <button className="btn-page-nav" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft size={18} /></button>
                        <button className="btn-page-nav" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><ChevronLeft size={18} /></button>
                        <div className="page-number">{currentPage}</div>
                        <button className="btn-page-nav" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight size={18} /></button>
                        <button className="btn-page-nav" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}><ChevronsRight size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewFieldList;
