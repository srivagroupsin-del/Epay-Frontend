import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "./unselect-category.css";
import "./addCategory.css";
import { getCategories, type CategoryRow } from "../models/category.api";
import { bulkToPrimary } from "../models/manageCategory.api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useCategoryStore } from "../../../store/useCategoryStore";


const ViewUnselectCategoryList = () => {
  /* ======================
     STATES
  ====================== */
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [primaryFilter, setPrimaryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [jumpInput, setJumpInput] = useState("1"); // Requirement #1

  /* ======================
     URL PERSISTENCE
  ====================== */
  useEffect(() => {
    setSearchParams({ page: String(currentPage) }, { replace: true });
    setJumpInput(String(currentPage)); // Requirement #7
  }, [currentPage, setSearchParams]);


  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [primarySearchText, setPrimarySearchText] = useState("");
  const primaryRef = useRef<HTMLDivElement>(null);

  const countOptions = [10, 20, 50, 100, 250, 500];

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    const loadData = async () => {
      showLoader("Loading categories, please wait...");
      try {
        const categories = await getCategories();
        setData(categories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };
    loadData();
  }, []);

  /* ======================
     CLICK OUTSIDE
  ====================== */
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (primaryRef.current && !primaryRef.current.contains(e.target as Node)) {
        setShowPrimaryDropdown(false);
        setPrimarySearchText("");
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  /* ======================
     FILTER LOGIC
  ====================== */
  const filtered = data.filter((item) => {
    const matchType =
      primaryFilter === "All"
        ? item.category_type === "primary"
        : item.category_type === "secondary" &&
        item.parent_category_name === primaryFilter;

    const matchSearch = item.category_name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  // Requirement #2, #4, #6: Jump Logic
  const handleJumpChange = (val: string) => {
    if (val === "") {
      setJumpInput("");
      return;
    }
    if (!/^\d+$/.test(val)) return;
    setJumpInput(val);

    const p = Number(val);
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  // Default tick all check boxes as requested.
  // Unselecting a check box will mark it to move to the primary list.
  useEffect(() => {
    if (filtered.length > 0) {
      setSelectedIds(filtered.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  }, [primaryFilter, data]);

  /* ======================
     SELECT HANDLERS
  ====================== */
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]); // Remove all ticks (unselect all)
    } else {
      setSelectedIds(filtered.map((i) => i.id)); // Tick all
    }
  };

  /* ======================
     SAVE UNSELECTED (MOVE TO PRIMARY)
  ====================== */
  const handleSave = async () => {
    // Identify categories that were UNTICKED (unselected)
    const untickedCategories = filtered.filter(
      (item) => !selectedIds.includes(item.id),
    );

    if (untickedCategories.length === 0) {
      alert("No categories unselected. Untick items to move them to the primary list.");
      return;
    }

    const untickedIds = untickedCategories.map((c) => c.id);

    try {
      setSaving(true);
      showLoader("Moving categories to primary list...");
      await bulkToPrimary(untickedIds);
      setData((prev) =>
        prev.map((item) => {
          if (untickedIds.includes(item.id)) {
            return {
              ...item,
              category_type: "primary",
              parent_category_name: "",
            };
          }
          return item;
        }),
      );
      showSuccess(`Successfully moved ${untickedCategories.length} categories to the Primary List permanently!`, "Moved Successfully!");
      setPrimaryFilter("All");
    } catch (error) {
      console.error("Failed to move categories:", error);
      alert("Error saving changes.");
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  /* ======================
     PAGE NUMBERS
  ====================== */
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="unselect-page">
      <GlobalStoreHeader />

      {/* HEADER */}
      <div className="unselect-header">
        <h2>View Unselect Category List</h2>
        <a href="/category/add" className="btn primary" style={{ textDecoration: "none" }}>Add New Sector</a>
      </div>

      {/* FILTER ROW */}
      <div className="filters-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '25px', marginBottom: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>

        {/* PRIMARY CATEGORY DROPDOWN */}
        <div className="filter" ref={primaryRef} style={{ width: '300px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Primary Category</label>
          <div className="custom-dropdown" style={{ position: 'relative' }}>
            <div
              className="custom-select-trigger"
              onClick={() => setShowPrimaryDropdown(!showPrimaryDropdown)}
            >
              <span>{primaryFilter === "All" ? "Select" : primaryFilter}</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </div>
            {showPrimaryDropdown && (
              <div className="custom-select-options">
                <div className="dropdown-search-wrapper">
                  <input
                    className="dropdown-search-input"
                    placeholder="Search primary..."
                    value={primarySearchText}
                    onChange={e => setPrimarySearchText(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                </div>
                <div className="dropdown-items-list">
                  <div
                    className="option-item"
                    onClick={() => { setPrimaryFilter("All"); setShowPrimaryDropdown(false); setPrimarySearchText(""); setCurrentPage(1); }}
                  >
                    Select
                  </div>
                  {data
                    .filter(c => c.category_type === "primary" && c.category_name.toLowerCase().includes(primarySearchText.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.id}
                        className="option-item"
                        onClick={() => {
                          setPrimaryFilter(c.category_name);
                          useCategoryStore.getState().setCategory(c.category_name);
                          setShowPrimaryDropdown(false);
                          setPrimarySearchText("");
                          setCurrentPage(1);
                        }}

                      >
                        {c.category_name}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SHOW ENTRIES */}
        <div className="filter">
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Show</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", height: "42px", minWidth: "70px", background: "#fff", outline: "none", cursor: "pointer" }}
          >
            {countOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* SEARCH BOX */}
        <div className="filter">
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: "250px", padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', height: '42px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
            />
          </div>
        </div>

        <button className="btn-save-unselected" onClick={handleSave} disabled={saving} style={{ height: '42px', marginLeft: 'auto' }}>
          {saving ? "Saving..." : "Move to Primary List"}
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="table-card" style={{ padding: '0' }}>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", fontSize: '16px', fontWeight: '600' }}>Loading...</div>
          ) : (
            <table className="unselect-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ width: "80px" }}>Select</th>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Category Option</th>
                  <th>Category Name</th>
                  <th>Photo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: '#9ca3af' }}>No categories found</td>
                  </tr>
                ) : (
                  paginated.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                      </td>
                      <td>Select</td>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td>{item.category_type === "primary" ? "Primary Category" : "Secondary Category"}</td>
                      <td className="category-name-cell" style={{ cursor: 'pointer' }} onClick={() => useCategoryStore.getState().setCategory(item.category_name)}>{item.category_name}</td>

                      <td className="photo-cell">
                        {item.image ? (
                          <img
                            src={`${IMAGE_BASE_URL}/${item.image}`}
                            alt={item.category_name}
                            style={{ width: '46px', height: '46px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: "46px", height: "46px", background: "#f3f4f6", borderRadius: "6px", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '10px' }}>No img</div>
                        )}
                      </td>
                      <td><span className={`badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION - Requirements #1, #2, #7 */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "15px", fontSize: "14px", color: "#6b7280" }}>
            <div>
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, filtered.length)} of {filtered.length} entries
            </div>

            <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
              <div className="page-jump-box">
                <span>Go to Page:</span>
                <input
                  type="text"
                  className="jump-input"
                  value={jumpInput}
                  onChange={(e) => handleJumpChange(e.target.value)}
                />
              </div>

              <div className="pagination-container">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="pagination-btn" title="First Page">≪</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn" title="Previous Page">‹</button>

                {getPageNumbers().map((num, i) => (
                  num === "..." ? (
                    <span key={`ell-${i}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button key={num} onClick={() => setCurrentPage(Number(num))} className={`pagination-btn ${currentPage === num ? 'active' : ''}`}>{num}</button>
                  )
                ))}

                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="pagination-btn" title="Next Page">›</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="pagination-btn" title="Last Page">≫</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewUnselectCategoryList;
