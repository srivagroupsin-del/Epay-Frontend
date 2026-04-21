import { useState, useEffect } from "react";
import { Pencil, Trash2, Camera } from "lucide-react";
import "./sectorTitleList.css";
// Note: sectorTitleList.css contains .page-jump-box, .jump-input, .pagination-container, .pagination-btn
import type { SectorTitle } from "../../../types/sectorTitletype";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { http } from "../../../base_api/base_api";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import { deleteItem } from "./Delete";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";
import { useBusinessStore } from "../../../store/useBusinessStore";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";



const SectorTitleList = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoading();
  const { showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;

  const [rows, setRows] = useState<SectorTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [jumpInput, setJumpInput] = useState(String(urlPage)); // Requirement #1

  /* ================= URL SYNC & JUMP SYNC ================= */
  useEffect(() => {
    setSearchParams({ page: String(currentPage) }, { replace: true });
    setJumpInput(String(currentPage)); // Requirement #7
  }, [currentPage, setSearchParams]);


  const countOptions = [10, 20, 50, 100, 250, 500];

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      showLoader("Loading sector titles, please wait...");
      try {
        const res = await http("/sectorTitleRoutes");
        const dataEntries = Array.isArray(res) ? res : res.data ?? res.rows ?? [];

        const mappedData = dataEntries.map((item: any) => ({
          ...item,
          image: item.image || item.base_image || item.sector_image || item.img || null,
          name: item.name || item.title || "—"
        }));

        setRows(mappedData);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    fetchData();
  }, []);

  /* ================= JUMP LOGIC ================= */
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

  /* ================= DELETE ================= */
  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting sector title...");
        await deleteItem(id);
        showDeleteSuccess("Sector Title has been deleted successfully.", "Deleted Successfully!");
        setRows(prev => prev.filter(row => row.id !== id));
      } catch (err: any) {
        alert(err.message || "Delete failed");
      } finally {
        hideLoader();
      }
    });
  };

  /* ================= FILTER ================= */
  /* ================= FILTER & SORT ================= */

  // 1. Search (startsWith)
  let result = rows.filter((item) =>
    item.name.toLowerCase().startsWith(search.toLowerCase())
  );

  // 2. Remove Duplicates (by name)
  const seen = new Set();
  result = result.filter((item) => {
    const nameLower = item.name.toLowerCase();
    if (seen.has(nameLower)) return false;
    seen.add(nameLower);
    return true;
  });

  // 3. Sort Alphabetically (A-Z)
  result.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const filteredRows = result;

  const totalPages = Math.ceil(filteredRows.length / limit);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

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

  if (loading) return null;
  if (error) return <p style={{ color: "red", padding: '40px', textAlign: 'center' }}>{error}</p>;

  return (
    <div className="page-container">
      <GlobalStoreHeader />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>View Sector Title List</h2>
        </div>

        <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                background: '#fff',
                height: '42px'
              }}
            >
              {countOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Search:</span>
            <input
              type="text"
              placeholder="Search Sector Title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                width: "220px",
                height: "42px",
                fontSize: "14px"
              }}
            />
          </div>

          <a
            href="/sector-titles/add"
            className="btn primary"
            style={{ textDecoration: "none", display: 'flex', alignItems: 'center', height: '42px', padding: '0 20px', borderRadius: '8px', background: '#323da7', color: '#fff', fontWeight: '600', fontSize: '14px' }}
          >
            Add Sector
          </a>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        {/* Requirement #8: Fixed header and scrollable body via .table-wrapper in CSS */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>#</th>
                <th style={{ width: '30%', textAlign: 'left' }}>Sector Title</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Photo</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Status</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: '40px', color: '#9ca3af' }}>
                    No Sector Titles Found
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{(currentPage - 1) * limit + index + 1}</td>
                    <td
                      style={{ cursor: "pointer", color: "#323da7", fontWeight: '600' }}
                      onClick={() => {
                        useBusinessStore.getState().setBusiness(item.name);
                        navigate(`/sector?sectorTitleId=${item.id}`);
                      }}
                    >
                      {item.name}
                    </td>


                    <td className="photo-cell" style={{ width: '20%', textAlign: 'center' }}>
                      {item.image ? (
                        <div className="table-img-wrapper" style={{ margin: '0 auto' }}>
                          <img
                            src={`${IMAGE_BASE_URL}/${item.image}`}
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/60?text=No+Img";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="table-img-wrapper empty" style={{ margin: '0 auto' }}>
                          <Camera size={20} className="camera-placeholder" />
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`status ${item.status === "active" ? "active" : "inactive"}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div className="action-icons" style={{ justifyContent: 'center' }}>
                        <Link
                          to={`/sector-title/edit/${item.id}?page=${currentPage}`}
                          state={item}
                          className="icon-btn edit"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </Link>

                        <button
                          className="icon-btn delete"
                          title="Delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION - Requirements #1, #2, #7 */}
        {!loading && filteredRows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 10px 10px', fontSize: '14px', color: '#6b7280' }}>
            <div>
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, filteredRows.length)} of {filteredRows.length} entries
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

export default SectorTitleList;
