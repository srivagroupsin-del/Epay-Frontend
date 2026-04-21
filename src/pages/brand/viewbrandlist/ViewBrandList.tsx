import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { Pencil, Trash2 } from "lucide-react";
import {
  getBrands,
  deleteBrand,
  type Brand,
} from "../../../api/brand.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBrandStore } from "../../../store/useBrandStore";
import "./ViewBrandList.css";


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

const ViewBrandList = () => {

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { showLoader, hideLoader } = useLoading();
  const { showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [jumpInput, setJumpInput] = useState(String(urlPage)); // Requirement #1

  // Handle URL change (back button)
  useEffect(() => {
    setCurrentPage(urlPage);
  }, [urlPage]);

  const countOptions = [10, 20, 50, 100, 250, 500];

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      showLoader("Loading brands, please wait...");
      const data = await getBrands();
      setBrands(data);
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Requirement #7: Sync jump input and URL with current page
  useEffect(() => {
    setJumpInput(String(currentPage));
    setSearchParams({ page: String(currentPage) }, { replace: true });
  }, [currentPage, setSearchParams]);

  /* ================= DELETE ================= */
  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting brand...");
        await deleteBrand(id);
        showDeleteSuccess("Brand has been deleted successfully.", "Deleted Successfully!");
        setBrands((prev) => prev.filter((b) => b.id !== id));
      } catch (err: any) {
        alert(err.message || "Delete failed");
      } finally {
        hideLoader();
      }
    });
  };

  /* ================= FILTER ================= */
  const filteredBrands = brands
    .filter((brand) =>
      brand.brand_name.toLowerCase().startsWith(search.toLowerCase()),
    )
    .sort((a, b) => a.brand_name.localeCompare(b.brand_name, undefined, { sensitivity: 'base' }));

  const totalPages = Math.ceil(filteredBrands.length / limit);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  // Requirement #2, #4, #6: Page Jump Logic
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

  /* ================= PAGE NUMBERS ================= */
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

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Brand – Master</h2>
          <p className="subtitle">View and manage brands</p>
        </div>

        <Link
          to="/brands/add"
          className="btn primary"
          style={{ textDecoration: "none" }}
        >
          Add New Brand
        </Link>
      </div>

      {/* CARD */}
      <div className="card">
        <div className="filters-row" style={{ display: 'flex', alignItems: 'flex-end', gap: '25px', marginBottom: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>

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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Search</label>
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
        </div>

        {/* TABLE - Requirement #8: scrollable body */}
        {loading ? null : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Brand</th>
                  <th>Photo</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedBrands.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      No Data Found
                    </td>
                  </tr>
                ) : (
                  paginatedBrands.map((brand, index) => (
                    <tr key={brand.id}>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td style={{ fontWeight: '600', color: '#1f2937', cursor: 'pointer' }} onClick={() => useBrandStore.getState().setBrand(brand.brand_name)}>{brand.brand_name}</td>


                      <td>
                        {brand.image ? (
                          <img
                            src={`${IMAGE_BASE_URL}/${brand.image}`}
                            alt={brand.brand_name}
                            style={{
                              width: "45px",
                              height: "45px",
                              objectFit: "contain",
                              borderRadius: "6px",
                              border: '1px solid #f3f4f6'
                            }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        <span className={`badge ${brand.status.toLowerCase()}`}>
                          {brand.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/brands/edit/${brand.id}?page=${currentPage}`}
                          className="mcb-btn-edit-link"
                          style={{
                            ...btnStyle,
                            padding: "8px",
                            marginRight: "12px",
                            minWidth: "32px",
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none'
                          }}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          style={{
                            ...btnStyle,
                            background: "#ef4444",
                            padding: "8px",
                            minWidth: "32px",
                          }}
                          onClick={() => handleDelete(brand.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION - Requirements #1, #2, #7 */}
        {!loading && filteredBrands.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              padding: "0 10px 10px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            <div>
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, filteredBrands.length)} of{" "}
              {filteredBrands.length} entries
            </div>

            <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
              {/* GO TO PAGE BOX */}
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
                    <span key={`ell-${i}`} style={{ color: "#6b7280", fontWeight: '600' }}>...</span>
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

export default ViewBrandList;
