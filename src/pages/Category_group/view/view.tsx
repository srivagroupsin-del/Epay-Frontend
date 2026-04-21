import { useState, useEffect, useMemo } from "react";
import "./view.css";
import { Search, SquarePen, Trash2, LayoutGrid, List } from "lucide-react";

import { useSearchParams, Link } from "react-router-dom";
import { getCategoryGroups, deleteCategoryGroup } from "../../category/models/categoryGroup.api";
import type { CategoryGroupRow } from "../../category/models/categoryGroup.api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import { getSectors, type Sector } from "../../../api/sectors.api";
import { getSubSubSectors, type SubSectorRow } from "../../subsector/models/subSectors.api";
import { getGroupsByBusiness, type BusinessCategoryGroupMapping } from "../../../api/businessCategoryGroup.api";

import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";

const CategoryGroupView = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlPage = Number(searchParams.get("page")) || 1;

    const [data, setData] = useState<CategoryGroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showDeleteSuccess } = useSuccessPopup();
    const { confirmDelete } = useDeleteConfirm();
    const [search, setSearch] = useState("");
    const [letterFilter, setLetterFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const countOptions = [10, 20, 50, 100, 250, 500];

    // 🔹 Inward Sync from URL
    useEffect(() => {
        setCurrentPage(urlPage);
    }, [urlPage]);

    // 🔹 Filter Data States
    const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
    const [allSectors, setAllSectors] = useState<Sector[]>([]);
    const [allSubSectors, setAllSubSectors] = useState<SubSectorRow[]>([]);
    const [businessMappings, setBusinessMappings] = useState<BusinessCategoryGroupMapping[]>([]);

    const [sectorTitleId, setSectorTitleId] = useState("");
    const [sectorId, setSectorId] = useState("");
    const [subSectorId, setSubSectorId] = useState("");

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            showLoader("Loading category groups, please wait...");
            try {
                const [result, titles, sectorsRaw, subRows] = await Promise.all([
                    getCategoryGroups(),
                    getSectorTitles(),
                    getSectors(),
                    getSubSubSectors(),
                ]);

                setData(Array.isArray(result) ? result : []);
                setSectorTitles(Array.isArray(titles) ? titles : []);
                setAllSectors(Array.isArray(sectorsRaw) ? sectorsRaw : []);
                setAllSubSectors(Array.isArray(subRows) ? subRows : []);
            } catch (error) {
                console.error("Failed to load core data", error);
                setData([]);
            } finally {
                setLoading(false);
                hideLoader();
            }
        };
        loadInitialData();
    }, []);

    // 🔹 Fetch mappings only when a sector is selected (to avoid 400 errors)
    useEffect(() => {
        const loadMappings = async () => {
            if (!sectorId) {
                setBusinessMappings([]);
                return;
            }
            try {
                const mappings = await getGroupsByBusiness(Number(sectorId));
                setBusinessMappings(Array.isArray(mappings) ? mappings : []);
            } catch (err) {
                console.warn("Failed to fetch sector mappings:", err);
                setBusinessMappings([]);
            }
        };
        loadMappings();
    }, [sectorId]);

    // 🔹 Cascading Data Logic
    const filteredSectorOptions = useMemo(() => {
        if (!sectorTitleId) return [];
        return allSectors.filter(s => String(s.sector_title_id) === String(sectorTitleId));
    }, [allSectors, sectorTitleId]);

    const filteredSubSectorOptions = useMemo(() => {
        if (!sectorId) return [];
        return allSubSectors.filter(ss => String(ss.sector_id) === String(sectorId));
    }, [allSubSectors, sectorId]);

    const handleDelete = (id: number) => {
        confirmDelete(async () => {
            try {
                showLoader("Deleting category group...");
                await deleteCategoryGroup(id);
                setData(prev => prev.filter(item => item.id !== id));
                showDeleteSuccess("Category Group has been deleted successfully.", "Deleted Successfully!");
            } catch (error) {
                console.error("Delete failed", error);
                alert("Delete failed ❌");
            } finally {
                hideLoader();
            }
        });
    };

    const filteredData = useMemo(() => {
        const term = search.trim().toLowerCase();

        return data
            .filter((item) => {
                const matchesSearch = !term || item.name?.toLowerCase().startsWith(term);

                const matchesLetter =
                    letterFilter === "All" || (item.name && item.name.toUpperCase().startsWith(letterFilter));

                // If sectorId is selected, show only items that exist in businessMappings
                if (sectorId) {
                    const isMapped = businessMappings.some(m => m.category_group_id === item.id && m.is_active !== 0);
                    if (!isMapped) return false;
                }

                // Filtering by Sector Title
                if (sectorTitleId && !sectorId) {
                    // This is handled by showing all, but we could filter if there was a global mapping endpoint
                    // Since there isn't, we show all groups when only Title is selected
                }

                return matchesSearch && matchesLetter;
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: 'base' }));
    }, [data, search, letterFilter, sectorId, sectorTitleId, businessMappings, allSectors]);

    /*
        const getBusinessNames = (groupId: number) => {
            const mappings = businessMappings.filter(m => m.category_group_id === groupId && m.is_active !== 0);
            if (mappings.length === 0) return "—";
            return mappings.map(m => {
                const s = allSectors.find(sec => sec.id === m.business_id);
                return s ? (s.sector_name || s.name) : `ID #${m.business_id}`;
            }).join(", ");
        };
    */


    const totalPages = Math.ceil(filteredData.length / limit);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return filteredData.slice(start, start + limit);
    }, [filteredData, currentPage, limit]);

    useEffect(() => {
        setSearchParams({ page: String(currentPage) }, { replace: true });
    }, [currentPage, setSearchParams]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, letterFilter, limit, sectorTitleId, sectorId, subSectorId]);

    // Safety: Reset current page if out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const stats = useMemo(() => {
        return {
            total: data.length,
            active: data.filter(item => (item.status || 'active').toLowerCase() === 'active').length,
            inactive: data.filter(item => (item.status || 'active').toLowerCase() === 'inactive').length
        };
    }, [data]);

    return (
        <div className="view-container">
            {/* 🔹 Header Area */}
            <div className="header-area">
                <div className="title-section">
                    <h1>Category Groups</h1>
                    <p>Manage and organize your product clusters</p>
                </div>
                <div className="action-section">
                    <div className="view-switcher">
                        <button
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <List size={20} />
                        </button>
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                    <Link to="/category-groups/create-title" className="add-new-btn secondary" style={{ marginRight: '8px' }}>
                        <span>+ Create Title</span>
                    </Link>
                    <Link to="/category-groups/add" className="add-new-btn">
                        <span>+ Add New Group</span>
                    </Link>
                </div>
            </div>

            {/* 🔍 Filter Panel */}
            <div className="filter-panel">
                <div className="search-bar-row">
                    <div className="premium-filter-group" style={{ flex: 2, minWidth: '300px' }}>
                        <label className="floating-label">Search</label>
                        <div className="search-input-wrapper" style={{ height: '48px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <Search size={18} color="#64748b" style={{ marginLeft: '12px' }} />
                            <input
                                type="text"
                                className="premium-input"
                                placeholder="Search category groups..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ border: 'none', boxShadow: 'none' }}
                            />
                        </div>
                    </div>

                    <div className="premium-filter-group" style={{ flex: 1, minWidth: '180px' }}>
                        <label className="floating-label">Letter Filter</label>
                        <select
                            value={letterFilter}
                            onChange={(e) => setLetterFilter(e.target.value)}
                            className="premium-input"
                        >
                            <option value="All">Select Filter (A-Z)</option>
                            {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map(char => (
                                <option key={char} value={char}>{char}</option>
                            ))}
                        </select>
                    </div>

                    <div className="premium-filter-group" style={{ width: '100px' }}>
                        <label className="floating-label">Show</label>
                        <select
                            className="premium-input"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                        >
                            {countOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="dropdown-filter-row">
                    <div className="premium-filter-group" style={{ flex: 1, minWidth: '250px' }}>
                        <label className="floating-label">Sector Title</label>
                        <select
                            className="premium-input"
                            value={sectorTitleId}
                            onChange={(e) => {
                                setSectorTitleId(e.target.value);
                                setSectorId("");
                                setSubSectorId("");
                            }}
                        >
                            <option value="">Select Sector Title</option>
                            {sectorTitles.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="premium-filter-group" style={{ flex: 1, minWidth: '250px' }}>
                        <label className="floating-label">Sector</label>
                        <select
                            className="premium-input"
                            value={sectorId}
                            onChange={(e) => {
                                setSectorId(e.target.value);
                                setSubSectorId("");
                            }}
                            disabled={!sectorTitleId}
                        >
                            <option value="">Select Sector</option>
                            {filteredSectorOptions.map(s => (
                                <option key={s.id} value={s.id}>{s.sector_name || s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="premium-filter-group" style={{ flex: 1, minWidth: '250px' }}>
                        <label className="floating-label">Subsector</label>
                        <select
                            className="premium-input"
                            value={subSectorId}
                            onChange={(e) => setSubSectorId(e.target.value)}
                            disabled={!sectorId}
                        >
                            <option value="">Select Subsector</option>
                            {filteredSubSectorOptions.map(ss => (
                                <option key={ss.id} value={ss.id}>{ss.sub_sector_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 📊 Stats Overview */}
            {!loading && (
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-label">Total Groups</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="stat-item">
                        <span className="stat-label">Active</span>
                        <span className="stat-badge active">{stats.active}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="stat-item">
                        <span className="stat-label">Inactive</span>
                        <span className="stat-badge inactive">{stats.inactive}</span>
                    </div>
                </div>
            )}

            {/* 📋 Results Display */}
            {loading ? null : filteredData.length > 0 ? (
                <>
                    {viewMode === "table" ? (
                        <div className="table-wrapper">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '70px' }}>S.No</th>
                                        <th>Image</th>
                                        <th>Group Name</th>
                                        <th>Status</th>
                                        <th>Description</th>
                                        <th className="text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((item, idx) => (
                                        <tr key={item.id}>
                                            <td><span className="id-badge">{(currentPage - 1) * limit + idx + 1}</span></td>
                                            <td>
                                                <div className="table-image">
                                                    {item.image ? (
                                                        <img src={`${IMAGE_BASE_URL}/${item.image}`} alt={item.name} />
                                                    ) : (
                                                        <div className="table-icon-fallback">{item.name.charAt(0)}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="group-info">
                                                    <span className="group-name">{item.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${item.status || 'active'}`}>
                                                    {item.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="desc-col">
                                                <p className="table-desc">{item.description || "No description provided."}</p>
                                            </td>
                                            <td className="text-center">
                                                <div className="table-actions" style={{ justifyContent: 'center', gap: '15px' }}>
                                                    <a
                                                        href={`/category-groups/edit/${item.id}?page=${currentPage}`}
                                                        className="action-icon view"
                                                        title="Edit"
                                                    >
                                                        <SquarePen size={24} />
                                                    </a>
                                                    <button
                                                        className="action-icon delete"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="results-grid">
                            {paginatedData.map((item) => (
                                <div key={item.id} className="category-card">
                                    {/* LEFT: Photo */}
                                    <div className="card-photo">
                                        {item.image ? (
                                            <img src={`${IMAGE_BASE_URL}/${item.image}`} alt={item.name} />
                                        ) : (
                                            <div className="card-photo-fallback">{item.name.charAt(0)}</div>
                                        )}
                                    </div>

                                    {/* RIGHT: Info + Actions */}
                                    <div className="card-right">
                                        <h3 className="card-name">{item.name}</h3>
                                        <p className="card-desc">{item.description || "No description provided."}</p>
                                        <span className={`status-pill ${item.status || 'active'}`}>
                                            {item.status || 'active'}
                                        </span>
                                        <div className="card-actions">
                                            <a
                                                href={`/category-groups/edit/${item.id}?page=${currentPage}`}
                                                className="action-icon view"
                                                title="Edit"
                                            >
                                                <SquarePen size={18} />
                                            </a>
                                            <button
                                                className="action-icon delete"
                                                onClick={() => handleDelete(item.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🔢 Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', gap: '8px' }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="pagination-button"
                            >
                                Prev
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="no-data">
                    <p>No category groups found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};

export default CategoryGroupView;