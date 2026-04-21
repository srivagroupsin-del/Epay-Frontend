import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SquarePen, Eye } from "lucide-react";
import { getUnitTypes, deleteUnitType } from "../models/unitType.api";
import type { UnitType } from "../models/unitType.api";
import "../viewcolour/viewColourList.css";

const ViewUnitTypeList = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState<UnitType[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getUnitTypes();
            setUnits(data);
        } catch (err: any) {
            console.error(err.message || "Failed to load units");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteUnitType(id);
            alert("Deleted");
            setUnits(prev => prev.filter(u => u.id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filtered = units.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    const totalEntries = filtered.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const currentData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="view-colour-container">
            <div className="view-colour-header">
                <h2>View Unit Type List</h2>
                <button className="btn-add-new-colour" onClick={() => navigate("/variant/add-unit-type")}>
                    Add New Unit Type
                </button>
            </div>
            <div className="view-colour-card">
                <h3>Unit Type - Master</h3>
                <div className="table-controls-top">
                    <div className="entries-control">Show <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}><option value={10}>10</option><option value={25}>25</option></select> entries</div>
                    <div className="search-control">Search: <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} /></div>
                </div>
                <div className="table-wrapper">
                    <table className="redesign-table">
                        <thead><tr><th># ↕</th><th>Unit Type ↕</th><th>Status ↕</th><th>Action ↕</th></tr></thead>
                        <tbody>
                            {currentData.length === 0 ? (<tr><td colSpan={4} style={{ textAlign: "center" }}>No data</td></tr>) : (
                                currentData.map((u, index) => (
                                    <tr key={u.id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td>{u.name}</td>
                                        <td><span className="status-badge">{u.status}</span></td>
                                        <td>
                                            <div className="action-icons">
                                                <button className="btn-icon-edit" onClick={() => navigate(`/variant/edit-unit-type/${u.id}`)}><SquarePen size={16} /></button>
                                                <button className="btn-icon-view" onClick={() => handleDelete(u.id)}><Eye size={16} /></button>
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

export default ViewUnitTypeList;
