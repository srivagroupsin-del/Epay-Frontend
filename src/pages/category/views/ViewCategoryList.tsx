import { FileEdit, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCategories, type CategoryRow } from "../models/category.api";

import { useSearchParams, Link } from "react-router-dom";
import { http } from "../../../base_api/base_api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";
import { useCategoryStore } from "../../../store/useCategoryStore";

import "./addCategory.css";


const ViewCategoryList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState<CategoryRow[]>([]);

  const [loading, setLoading] = useState(true);
  const { showLoader, hideLoader } = useLoading();
  const { showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();

  const [categoryType, setCategoryType] = useState("All");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [jumpInput, setJumpInput] = useState(String(urlPage)); // Requirement #1

  /* ======================
     URL PERSISTENCE & JUMP SYNC
  ====================== */
  useEffect(() => {
    setSearchParams({ page: String(currentPage) }, { replace: true });
    setJumpInput(String(currentPage)); // Requirement #7
  }, [currentPage, setSearchParams]);


  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const typeRef = useRef<HTMLDivElement>(null);

  const countOptions = [10, 20, 50, 100, 250, 500];



  const categoryOptions = [
    { label: "All Categories", value: "All" },
    ...Array.from(new Set(data.map(item => item.category_name)))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .map(name => ({
        label: name,
        value: name
      }))
  ];

  /* ======================
     CLICK OUTSIDE
  ====================== */
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
        setTypeSearch("");
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  /* ======================
     FETCH DATA
  ====================== */
  useEffect(() => {
    const load = async () => {
      showLoader("Loading categories, please wait...");
      try {
        const rows = await getCategories();
        setData(rows);


      } catch (err) {
        console.error("Failed to load categories", err);
        setData([]);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    load();
  }, []);



  const filtered = data
    .filter((item) => {
      const matchCategory =
        categoryType === "All" ||
        item.category_name === categoryType;

      const matchSearch = item.category_name
        .toLowerCase()
        .startsWith(search.toLowerCase());

      return matchCategory && matchSearch;
    })
    .sort((a, b) => a.category_name.localeCompare(b.category_name, undefined, { sensitivity: 'base' }));

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

  // Safety: Reset current page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  /* ======================
     DELETE
  ====================== */
  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting category...");
        await http(`/categories/${id}`, {
          method: "DELETE",
        });

        setData((prev) => prev.filter((item) => item.id !== id));
        showDeleteSuccess("Category has been deleted successfully.", "Deleted Successfully!");
      } catch (err) {
        console.error(err);
        alert("Delete error ❌");
      } finally {
        hideLoader();
      }
    });
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
    <div className="page-container">
      <GlobalStoreHeader />

      <div className="page-header">
        <div>
          <h2>View Category List</h2>
          <p className="subtitle">Manage primary and secondary categories</p>
        </div>
        <a
          href="/category/add"
          className="btn primary"
          style={{ textDecoration: "none" }}
        >
          Add New Category
        </a>
      </div>

      <div className="card">
        {/* NEW UNIFIED FILTERS ROW */}
        <div className="filters-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '25px', marginBottom: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', position: 'relative', border: '1px solid #e5e7eb' }}>

          {/* COMBINED CATEGORY & SEARCH */}
          <div className="filter" ref={typeRef} style={{ flex: 1, position: 'relative', zIndex: showTypeDropdown ? 1000 : 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Search Categories</label>
            <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', overflow: 'visible', height: '42px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
              {/* DROPDOWN PART */}
              <div style={{ position: 'relative', borderRight: '1px solid #d1d5db' }}>
                <div
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  style={{
                    height: '100%',
                    padding: '0 15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    background: '#f9fafb',
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '700',
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    minWidth: '160px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{categoryOptions.find(o => o.value === categoryType)?.label || "All Categories"}</span>
                  <span style={{ fontSize: '10px' }}>▼</span>
                </div>

                {showTypeDropdown && (
                  <div className="custom-select-options" style={{ width: '250px', top: 'calc(100% + 5px)' }}>
                    <div className="dropdown-search-wrapper">
                      <input
                        className="dropdown-search-input"
                        placeholder="Filter..."
                        value={typeSearch}
                        onChange={e => setTypeSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    <div className="dropdown-items-list">
                      {categoryOptions.filter(o => o.value === "All" || o.label.toLowerCase().startsWith(typeSearch.toLowerCase())).length > 0 ? (
                        categoryOptions
                          .filter(o => o.value === "All" || o.label.toLowerCase().startsWith(typeSearch.toLowerCase()))
                          .map(opt => (
                            <div
                              key={opt.value}
                              className="option-item"
                              onClick={() => {
                                setCategoryType(opt.value);
                                if (opt.value !== "All") useCategoryStore.getState().setCategory(opt.value);
                                setShowTypeDropdown(false);
                                setTypeSearch("");
                                setCurrentPage(1);
                              }}

                            >
                              {opt.label}
                            </div>
                          ))
                      ) : (
                        <div className="option-item empty">
                          No Data Found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SEARCH INPUT PART */}
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <input
                  className="search-input"
                  placeholder="Type to search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: "100%",
                    height: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    fontSize: '14px',
                    color: '#1f2937',
                    background: 'transparent',
                    outline: 'none',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* SHOW ENTRIES */}
          <div className="filter" style={{ zIndex: 1 }}>
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
                width: '75px',
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
        </div>

        {/* TABLE - Requirement #8: scrollable body */}
        <div className="table-wrapper">
          {loading ? null : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Sector Title</th>
                  <th>Sector</th>
                  <th>SubSector</th>
                  <th>Parent Category Name</th>
                  <th>Category Option</th>
                  <th>Category Name</th>
                  <th>Photo</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No categories found</td>
                  </tr>
                ) : (
                  paginated.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td style={{ cursor: 'pointer' }} onClick={() => useBusinessStore.getState().setBusiness(item.sector_title_name)}>{item.sector_title_name ?? "—"}</td>
                      <td style={{ cursor: 'pointer' }} onClick={() => useBusinessStore.getState().setBusiness(item.sector_name)}>{item.sector_name ?? "—"}</td>
                      <td style={{ cursor: 'pointer' }} onClick={() => useBusinessStore.getState().setBusiness(item.sub_sector_name)}>{item.sub_sector_name ?? "—"}</td>

                      <td style={{ color: '#4f46e5', fontWeight: '500' }}>{item.parent_category_name || "—"}</td>
                      <td>
                        {item.category_type === "primary"
                          ? "Primary Category"
                          : "Secondary Category"}
                      </td>
                      <td style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => useCategoryStore.getState().setCategory(item.category_name)}>{item.category_name}</td>

                      <td>
                        {item.image ? (
                          <img
                            src={`${IMAGE_BASE_URL}/${item.image.replace(/^(\/?uploads\/|\/)/, '')}`}
                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }}
                            alt={item.category_name}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className={`badge ${item.status}`}>
                          {item.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-group">
                          <Link
                            to={`/categories/edit/${item.id}?page=${currentPage}`}
                            state={item}
                            className="edit-link"
                            title="Edit"
                          >
                            <FileEdit size={18} />
                          </Link>
                          <button
                            title="Delete"
                            className="delete-btn"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "0 10px 10px", fontSize: "14px", color: "#6b7280" }}>
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

export default ViewCategoryList;
