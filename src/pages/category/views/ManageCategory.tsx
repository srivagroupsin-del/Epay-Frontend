import { useEffect, useState } from "react";
import {
  bulkToPrimary,
  bulkToSecondary,
} from "../models/manageCategory.api";
import { http } from "../../../base_api/base_api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";

import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useCategoryStore } from "../../../store/useCategoryStore";
import "./addCategory.css";


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
  status: "active" | "inactive";
};

type ParentCategory = {
  id: number;
  category_name: string;
};

const ManageCategory = () => {
  const { showLoader, hideLoader } = useLoading();
  const { showSuccess } = useSuccessPopup();
  /* ======================
     STATE
  ====================== */
  const [data, setData] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterPrimaryCategory, setFilterPrimaryCategory] = useState("");
  const [enableSecondaryFilter, setEnableSecondaryFilter] = useState(true);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState("1");

  const countOptions = [10, 20, 50, 100, 250, 500];

  const [setOption, setSetOption] = useState("");
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);



  /* ======================
     LOAD CATEGORIES
  ====================== */
  useEffect(() => {
    const load = async () => {
      showLoader("Loading categories, please wait...");
      try {
        const json = await http("/categories");
        setData(json.data ?? []);
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
     LOAD PRIMARY PARENTS
  ====================== */
  useEffect(() => {
    const loadParents = async () => {
      try {
        const json = await http("/categories");
        console.log("API Data Categories:", json);
        const primary = (json.data ?? []).filter(
          (c: CategoryRow) => c.category_type === "primary"
        );
        setParentCategories(primary);
      } catch (e) {
        console.error(e);
      }
    }
    loadParents();
  }, []);

  /* ======================
     FILTER
  ====================== */
  const filtered = data.filter(item => {
    if (!filterPrimaryCategory) {
      const matchSearch = item.category_name.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    }
    if (enableSecondaryFilter) {
      return item.category_type === "secondary" &&
        String((item as any).parent_category_id) === filterPrimaryCategory &&
        item.category_name.toLowerCase().includes(search.toLowerCase());
    } else {
      return item.id === Number(filterPrimaryCategory) &&
        item.category_name.toLowerCase().includes(search.toLowerCase());
    }
  });

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit
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

  const allSelected =
    paginated.length > 0 &&
    paginated.every(item => selectedIds.includes(item.id));

  /* ======================
     CHECKBOX HANDLERS
  ====================== */
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev =>
        prev.filter(id => !paginated.some(item => item.id === id))
      );
    } else {
      setSelectedIds(prev => [
        ...new Set([...prev, ...paginated.map(item => item.id)]),
      ]);
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  /* ======================
     SAVE (BULK)
  ====================== */
  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one category");
      return;
    }
    if (!setOption) {
      alert("Please select category option");
      return;
    }

    try {
      showLoader("Saving category changes...");
      if (setOption === "Primary Category") {
        await bulkToPrimary(selectedIds);
      }
      if (setOption === "Secondary Category") {
        if (!parentCategoryId) {
          alert("Parent category is required");
          hideLoader();
          return;
        }
        const parentId = Number(parentCategoryId);
        if (!Number.isInteger(parentId) || parentId <= 0) {
          alert("Invalid parent category selected");
          hideLoader();
          return;
        }
        await bulkToSecondary(selectedIds, parentId);
      }
      showSuccess("Categories updated successfully.", "Saved Successfully!");
      setSelectedIds([]);
      setParentCategoryId("");
      setSetOption("");
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
      <h2>Manage Categories</h2>


      <div className="card">
        {/* FILTERS SECTION */}
        <div style={{ display: "flex", gap: "25px", alignItems: "flex-end", marginBottom: "25px", background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>

          <div style={{ flex: 1, maxWidth: "250px" }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>Primary Category</label>
              <select
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                  height: "42px",
                  cursor: "pointer"
                }}
                value={filterPrimaryCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterPrimaryCategory(val);
                  const label = parentCategories.find(pc => String(pc.id) === val)?.category_name;
                  if (label) useCategoryStore.getState().setCategory(label);
                  setCurrentPage(1);
                }}
              >
                <option value="">-- All Categories --</option>
                {parentCategories.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#4b5563" }}>
              <input
                type="checkbox"
                checked={enableSecondaryFilter}
                onChange={e => setEnableSecondaryFilter(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              Enable Secondary
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginLeft: "auto" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#4b5563" }}>Search</label>
            <input
              className="search-input-fixed"
              placeholder="Search category..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "200px",
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                height: '42px'
              }}
            />
          </div>
        </div>
        <div className="filters-grid" style={{ marginBottom: "15px", borderTop: "1px solid #eee", paddingTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Show</span>
            <select
              value={limit}
              onChange={e => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
            >
              {countOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={setOption}
              onChange={e => {
                setSetOption(e.target.value);
                setParentCategoryId("");
              }}
              style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            >
              <option value="">-- Select --</option>
              <option>Primary Category</option>
              <option>Secondary Category</option>
            </select>

            {setOption === "Secondary Category" && (
              <div style={{ position: 'relative', width: '220px' }}>
                <select
                  style={{
                    width: '100%',
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    outline: "none",
                    height: '35px',
                    fontSize: '14px',
                    cursor: "pointer"
                  }}
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                >
                  <option value="">Select Parent</option>
                  {parentCategories.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button style={btnStyle} onClick={handleSave}>Save</button>
          </div>
        </div>
        {/* TABLE - Requirement #8: scrollable body */}
        <div className="table-wrapper">
          {loading ? null : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th>Category Type</th>
                  <th>Category Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No categories found</td>
                  </tr>
                ) : (
                  paginated.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id)} />
                      </td>
                      <td>{item.category_type === "primary" ? "Primary Category" : "Secondary Category"}</td>
                      <td style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => useCategoryStore.getState().setCategory(item.category_name)}>{item.category_name}</td>
                      <td><span className={`badge ${item.status}`}>{item.status}</span></td>
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

export default ManageCategory;
