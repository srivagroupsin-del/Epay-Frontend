import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import {
    getCategoryBrandMappings,
    type CategoryBrandMappingItem,
} from "../../../../api/categoryBrandMapping.api";

const BLUE = "#323da7";
const btnStyle: React.CSSProperties = {
    background: BLUE,
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
};

const ViewCategoryBrand = () => {
    const navigate = useNavigate();
    const [mappings, setMappings] = useState<CategoryBrandMappingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedPrimary, setSelectedPrimary] = useState("");
    const [selectedSecondary, setSelectedSecondary] = useState("");

    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const countOptions = [10, 20, 50, 100, 250, 500];

    /* ======================
       LOAD DATA
    ====================== */
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getCategoryBrandMappings();
                setMappings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load category-brand mappings:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    /* ======================
       UNIQUE FILTER OPTIONS
    ====================== */
    const primaryCategories = useMemo(() => {
        const unique = new Map<number, string>();
        mappings.forEach(m => {
            if (m.primaryId && m.primaryName) {
                unique.set(m.primaryId, m.primaryName);
            }
        });
        return Array.from(unique.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [mappings]);

    const secondaryList = useMemo(() => {
        const unique = new Map<number, string>();
        mappings.forEach(m => {
            if (m.secondaryId && m.secondaryName) {
                if (!selectedPrimary || String(m.primaryId) === selectedPrimary) {
                    unique.set(m.secondaryId, m.secondaryName);
                }
            }
        });
        return Array.from(unique.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [mappings, selectedPrimary]);

    /* ======================
       FILTERED & PAGINATED
    ====================== */
    const filteredMappings = useMemo(() => {
        return mappings.filter(m => {
            const matchPrimary = !selectedPrimary || String(m.primaryId) === selectedPrimary;
            const matchSecondary = !selectedSecondary || String(m.secondaryId) === selectedSecondary;
            return matchPrimary && matchSecondary;
        });
    }, [mappings, selectedPrimary, selectedSecondary]);

    const totalPages = Math.ceil(filteredMappings.length / limit);
    const paginatedMappings = filteredMappings.slice(
        (currentPage - 1) * limit,
        currentPage * limit
    );

    const handleDeleteMapping = async (mapping: CategoryBrandMappingItem) => {
        if (!window.confirm(`Are you sure you want to remove the mapping for "${mapping.brandName}" under "${mapping.primaryName}"?`)) return;
        // TODO: Implement delete API call when backend supports it
        alert("Delete mapping not yet implemented on backend.");
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h2>View Category Brand Mappings</h2>
                    <p className="subtitle">Overview of brands assigned to categories</p>
                </div>
                <button
                    style={btnStyle}
                    onClick={() => navigate("/add-category-brand")}
                    className="btn-with-icon"
                >
                    <Plus size={16} /> Add New Mapping
                </button>
            </div>

            <div className="card">
                {/* FILTERS */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px", background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>Filter by Primary</label>
                        <select
                            value={selectedPrimary}
                            onChange={(e) => {
                                setSelectedPrimary(e.target.value);
                                setSelectedSecondary("");
                                setCurrentPage(1);
                            }}
                            className="custom-select"
                            style={{ padding: "8px", borderRadius: "4px", minWidth: "200px" }}
                        >
                            <option value="">All Primary</option>
                            {primaryCategories.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>Filter by Secondary</label>
                        <select
                            value={selectedSecondary}
                            onChange={(e) => {
                                setSelectedSecondary(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="custom-select"
                            style={{ padding: "8px", borderRadius: "4px", minWidth: "200px" }}
                        >
                            <option value="">All Secondary</option>
                            {secondaryList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* LIMIT SELECTOR */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>Show</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            style={{
                                padding: '6px 10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            {countOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="loading">Loading mappings...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "50px" }}>#</th>
                                    <th>Primary Category</th>
                                    <th>Secondary Category</th>
                                    <th>Brand Name</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedMappings.map((m, index) => (
                                    <tr key={m.mappingId}>
                                        <td>{(currentPage - 1) * limit + index + 1}</td>
                                        <td style={{ fontWeight: "600" }}>{m.primaryName}</td>
                                        <td>{m.secondaryName || "—"}</td>
                                        <td style={{ fontWeight: "500", color: "#666" }}>{m.brandName}</td>
                                        <td style={{ textAlign: "center", display: "flex", gap: "10px", justifyContent: "center" }} className="action-icons">
                                            <a
                                                href={`/manage-category-brand?mappingId=${m.mappingId}`}
                                                className="btn-icon-edit"
                                                title="Edit Mapping"
                                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                                            >
                                                <SquarePen size={14} />
                                            </a>
                                            <button
                                                className="btn-icon-delete"
                                                onClick={() => handleDeleteMapping(m)}
                                                title="Delete Mapping"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMappings.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="empty">No mappings found matching filters</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && filteredMappings.length > 0 && totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #d1d5db", cursor: "pointer" }}
                        >
                            ‹ Prev
                        </button>
                        <span style={{ padding: "6px 12px", fontSize: "14px", color: "#475569" }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #d1d5db", cursor: "pointer" }}
                        >
                            Next ›
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewCategoryBrand;
