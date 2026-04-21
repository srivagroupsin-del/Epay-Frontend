import { useEffect, useState, useRef } from "react";
import "./addCategory.css";
import { http } from "../../../base_api/base_api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { bulkToSecondary } from "../models/manageCategory.api";
import { Save } from "lucide-react";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useCategoryStore } from "../../../store/useCategoryStore";


const BLUE = "#323da7";
const btnStyle: React.CSSProperties = {
  background: BLUE,
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

/* ======================
   TYPES
====================== */
type CategoryRow = {
  id: number;
  category_type: "primary" | "secondary";
  category_name: string;
  image?: string | null;
};


const PrimarySecondaryCategoryMapping = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  /* ======================
     STATE
  ====================== */
  const [primaryCategories, setPrimaryCategories] = useState<CategoryRow[]>([]);
  const [secondaryCategories, setSecondaryCategories] = useState<CategoryRow[]>([]);

  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState("1");

  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [primarySearchText, setPrimarySearchText] = useState("");
  const primaryRef = useRef<HTMLDivElement>(null);

  const countOptions = [10, 20, 50, 100, 250, 500];

  /* ======================
     LOAD CATEGORIES
  ====================== */
  useEffect(() => {
    const load = async () => {
      showLoader("Loading categories, please wait...");
      try {
        const json = await http("/categories");
        const rows: CategoryRow[] = json.data ?? [];
        setPrimaryCategories(rows.filter(c => c.category_type === "primary"));
        setSecondaryCategories(rows.filter(c => c.category_type === "secondary"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };
    load();
  }, []);

  // Requirement #7: Sync jump input
  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

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
     FILTER SECONDARY
  ====================== */
  const filtered = secondaryCategories.filter(c =>
    c.category_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const allSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;

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

  /* ======================
     CHECKBOX HANDLERS
  ====================== */
  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : filtered.map(i => i.id));
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  /* ======================
     SAVE MAPPING
  ====================== */
  const handleSave = async () => {
    if (!selectedPrimaryId) {
      alert("Please select a Primary Category");
      return;
    }
    if (selectedIds.length === 0) {
      alert("Please select at least one Secondary Category");
      return;
    }

    const parentId = Number(selectedPrimaryId);
    if (Number.isNaN(parentId)) {
      alert("Invalid primary category selected");
      return;
    }

    try {
      showLoader("Saving category mapping...");
      await bulkToSecondary(selectedIds, parentId);
      showSuccess("Mapping saved successfully.", "Saved Successfully!");
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
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

  /* ======================
     UI
  ====================== */
  return (
    <div className="page-container">
      <GlobalStoreHeader />

      <h2>Primary → Secondary Category Mapping</h2>

      <div className="card">
        {/* FILTERS & ACTIONS ROW */}
        <div className="filters-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '25px', marginBottom: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>

          {/* PRIMARY CATEGORY DROPDOWN */}
          <div className="filter" ref={primaryRef} style={{ width: '300px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Primary Category</label>
            <div className="custom-dropdown" style={{ position: 'relative' }}>
              <div
                className="custom-select-trigger"
                onClick={() => setShowPrimaryDropdown(!showPrimaryDropdown)}
              >
                <span>{primaryCategories.find(p => String(p.id) === selectedPrimaryId)?.category_name || "Select Primary Category"}</span>
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
                    {primaryCategories
                      .filter(p => p.category_name.toLowerCase().includes(primarySearchText.toLowerCase()))
                      .map(p => (
                        <div
                          key={p.id}
                          className="option-item"
                          onClick={() => {
                            setSelectedPrimaryId(String(p.id));
                            useCategoryStore.getState().setCategory(p.category_name);
                            setSelectedIds([]);
                            setShowPrimaryDropdown(false);
                            setPrimarySearchText("");
                          }}

                        >
                          {p.category_name}
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
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                height: '42px',
                minWidth: '70px',
                color: '#1f2937',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {countOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* SEARCH BOX */}
          <div className="filter">
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Search Secondary</label>
            <div style={{ position: 'relative' }}>
              <input
                className="search-input"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "250px",
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  height: '42px',
                  fontSize: '14px',
                  color: '#1f2937',
                  background: '#fff'
                }}
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            style={{ ...btnStyle, height: '42px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={selectedIds.length === 0 || !selectedPrimaryId}
            onClick={handleSave}
          >
            <Save size={18} /> Save Mapping
          </button>
        </div>

        {/* TABLE - Requirement #8: scrollable body */}
        <div className="table-wrapper">
          {loading ? null : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Secondary Category</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px' }}>
                      No secondary categories found
                    </td>
                  </tr>
                ) : (
                  paginated.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleOne(item.id)}
                        />
                      </td>
                      <td style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => useCategoryStore.getState().setCategory(item.category_name)}>{item.category_name}</td>

                      <td>
                        {item.image ? (
                          <img
                            src={`${IMAGE_BASE_URL}/${item.image}`}
                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }}
                            alt={item.category_name}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION - Requirements #1, #2, #7 */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 10px 10px', fontSize: '14px', color: '#6b7280' }}>
            <div>
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, filtered.length)} of {filtered.length} entries
            </div>

            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
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
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                  title="First Page"
                >
                  ≪
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                  title="Previous Page"
                >
                  ‹
                </button>

                {getPageNumbers().map((num, i) => (
                  num === "..." ? (
                    <span key={`ell-${i}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(Number(num))}
                      className={`pagination-btn ${currentPage === num ? 'active' : ''}`}
                    >
                      {num}
                    </button>
                  )
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                  title="Next Page"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                  title="Last Page"
                >
                  ≫
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimarySecondaryCategoryMapping;
