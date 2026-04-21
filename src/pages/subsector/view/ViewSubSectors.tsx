import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SquarePen, Trash2 } from "lucide-react";
import { IMAGE_BASE_URL } from "../../../base_api/api_list";
import {
  getSubSubSectors,
  type SubSectorRow,
} from "../models/subSectors.api";
import { deleteSubSubSector } from "../models/subSectors.api";
import { useLoading } from "../../../context/LoadingContext";
import { useSuccessPopup } from "../../../context/SuccessPopupContext";
import { useDeleteConfirm } from "../../../context/DeleteConfirmContext";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";
import { getSectors, type Sector } from "../../../api/sectors.api";
import "./viewSubSectors.css";



/* ======================
   UI TYPE (DISPLAY ONLY)
====================== */
type SubSectorUI = {
  id: number;
  sectorTitle: string;
  sector: string;
  subSector: string;
  image: string | null;
  status: "Active" | "Inactive";
};

const ViewSubSectors = () => {
  /* ======================
     STATES
  ====================== */
  const { showLoader, hideLoader } = useLoading();
  const { showDeleteSuccess } = useSuccessPopup();
  const { confirmDelete } = useDeleteConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;

  const [rows, setRows] = useState<SubSectorRow[]>([]); // backend rows
  const [data, setData] = useState<SubSectorUI[]>([]); // UI rows
  const [loading, setLoading] = useState(true);

  const [sectorTitleFilter, setSectorTitleFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [jumpInput, setJumpInput] = useState(String(urlPage));

  /* ======================
     URL PERSISTENCE & JUMP SYNC
  ====================== */
  useEffect(() => {
    setSearchParams({ page: String(currentPage) }, { replace: true });
    setJumpInput(String(currentPage));
  }, [currentPage, setSearchParams]);


  const [sectorTitlesList, setSectorTitlesList] = useState<SectorTitle[]>([]);
  const [sectorsList, setSectorsList] = useState<Sector[]>([]);



  const countOptions = [10, 20, 50, 100, 250, 500];



  const handleDelete = (id: number) => {
    confirmDelete(async () => {
      try {
        showLoader("Deleting subsector...");
        await deleteSubSubSector(id);
        setData(prev => prev.filter(item => item.id !== id));
        showDeleteSuccess("SubSector has been deleted successfully.", "Deleted Successfully!");
      } catch (err: any) {
        alert(err.message || "Delete failed");
      } finally {
        hideLoader();
      }
    });
  };

  /* ======================
     FETCH DATA
  ====================== */
  useEffect(() => {
    const load = async () => {
      showLoader("Loading subsectors, please wait...");
      try {
        setLoading(true);
        const apiRows = await getSubSubSectors();
        setRows(apiRows);

        setData(
          apiRows.map(r => ({
            id: r.id,
            sectorTitle: r.sector_title_name ?? "—",
            sector: r.sector_name ?? "—",
            subSector: r.sub_sector_name ?? "—",
            image: r.image,
            status: r.status === "active" ? "Active" : "Inactive",
          }))
        );
      } catch (err) {
        console.error("Failed to load subsectors", err);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    const loadFilters = async () => {
      try {
        const [titles, scs] = await Promise.all([
          getSectorTitles(),
          getSectors()
        ]);
        console.log("API Data SectorTitles:", titles);
        console.log("API Data Sectors:", scs);
        setSectorTitlesList(titles);
        setSectorsList(scs);
      } catch (err) {
        console.error("Failed to load filter data", err);
      }
    };

    load();
    loadFilters();
  }, []);



  /* ======================
     FILTER LOGIC
  ====================== */
  const filtered = data
    .filter(item => {
      const matchTitle =
        sectorTitleFilter === "All" ||
        item.sectorTitle === sectorTitleFilter;

      const matchSector =
        sectorFilter === "All" ||
        item.sector === sectorFilter;

      const matchSearch =
        item.subSector.toLowerCase().startsWith(search.toLowerCase());

      return matchTitle && matchSector && matchSearch;
    })
    .sort((a, b) => a.subSector.localeCompare(b.subSector, undefined, { sensitivity: 'base' }));

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

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
     FILTER OPTIONS
  ====================== */
  const sectorTitlesOptions = [
    "All",
    ...Array.from(new Set(
      sectorTitlesList.map(t => t.title).filter(title => title && title.trim() !== "")
    )).sort((a, b) => a.localeCompare(b))
  ];

  const sectorsOptions = [
    "All",
    ...Array.from(new Set(
      sectorsList
        .filter(s => {
          if (sectorTitleFilter === "All") return true;
          const sTitle = s.sector_title || "";
          return sTitle.trim().toLowerCase() === sectorTitleFilter.trim().toLowerCase();
        })
        .map(s => s.sector_name || "")
        .filter(name => name.trim() !== "")
    )).sort((a, b) => a.localeCompare(b))
  ];

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
          <h2>View SubSector List</h2>
          <p className="subtitle">Manage all subsectors</p>
        </div>
        <a
          href="/subsector/add"
          className="btn primary"
          style={{ textDecoration: "none" }}
        >
          Add New SubSector
        </a>
      </div>

      {/* CARD */}
      <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* FILTERS */}
        <div className="filters-row">
          <div className="premium-filter-group" style={{ width: '300px' }}>
            <label className="floating-label">Sector Title</label>
            <select
              className="premium-input"
              value={sectorTitleFilter}
              onChange={(e) => {
                const title = e.target.value;
                setSectorTitleFilter(title);
                setSectorFilter("All");
                useBusinessStore.getState().setBusiness(title);
                setCurrentPage(1);
              }}
              style={{ cursor: 'pointer' }}
            >
              {sectorTitlesOptions.map((title, idx) => (
                <option key={`title-${idx}`} value={title}>
                  {title === "All" ? "Select Sector Title" : title}
                </option>
              ))}
            </select>
          </div>

          <div className="premium-filter-group" style={{ width: '300px' }}>
            <label className="floating-label">Sector</label>
            <select
              className="premium-input"
              value={sectorFilter}
              onChange={(e) => {
                const sec = e.target.value;
                setSectorFilter(sec);
                useBusinessStore.getState().setBusiness(sec);
                setCurrentPage(1);
              }}
              style={{ cursor: 'pointer' }}
            >
              {sectorsOptions.map((sec, idx) => (
                <option key={`sec-${idx}`} value={sec}>
                  {sec === "All" ? "Select Sector" : sec}
                </option>
              ))}
            </select>
          </div>

          <div className="premium-filter-group" style={{ width: '100px' }}>
            <label className="floating-label">Show</label>
            <select
              className="premium-input"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ cursor: 'pointer' }}
            >
              {countOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="premium-filter-group" style={{ width: '280px' }}>
            <label className="floating-label">Search</label>
            <input
              className="premium-input"
              placeholder="Search subsector..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="loading" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading subsectors...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>SECTOR TITLE</th>
                  <th>SECTOR</th>
                  <th>SUBSECTOR</th>
                  <th>PHOTO</th>
                  <th>STATUS</th>
                  <th className="text-center">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      No subsectors found
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, index) => {
                    const backendRow = rows.find(r => r.id === item.id);

                    return (
                      <tr key={item.id}>
                        <td>{(currentPage - 1) * limit + index + 1}</td>
                        <td style={{ fontWeight: '500' }}>{item.sectorTitle}</td>
                        <td>{item.sector}</td>
                        <td style={{ fontWeight: '600', color: '#1f2937' }}>{item.subSector}</td>
                        <td>
                          {item.image ? (
                            <img
                              src={`${IMAGE_BASE_URL}/${item.image}`}
                              alt={item.subSector}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "contain",
                                borderRadius: 6,
                              }}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className={`badge ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <Link
                              to={`/sub-sectors/edit/${item.id}?page=${currentPage}`}
                              state={backendRow}
                              className="action-btn edit"
                              title="Edit"
                            >
                              <SquarePen size={24} />
                            </Link>

                            <button
                              className="action-btn delete"
                              title="Delete"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 size={24} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
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

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                    <span key={`ell-${i}`} style={{ color: '#6b7280', fontWeight: '600' }}>...</span>
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

export default ViewSubSectors;
