import { useState } from "react";
import { Plus, Check, FolderOpen, Menu as MenuIcon, List, CheckSquare } from "lucide-react";

// APIs
import { getAllMasters, createMaster, type Master } from "../../api/multitab/master.api";
import { getMenusByMaster, createMenu, type Menu } from "../../api/multitab/menu.api";
import { getHeadingsByMenu, createHeading, type Heading } from "../../api/multitab/heading.api";
import { getCheckboxes, createCheckbox, type Checkbox } from "../../api/multitab/checkbox.api";
import { getMappingByHeading, createMapping, deleteMapping, type Mapping } from "../../api/multitab/mapping.api";

// Reusable Styles
import "../variant/addunittype/addUnitType.css";

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
type ModuleType = "category" | "sector" | "subsector" | "brand" | "global";

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------
const MultitabManager = () => {
    // --- STATE: STEP 1 (MASTER) ---
    const [moduleType, setModuleType] = useState<ModuleType>("global");
    const [moduleId, setModuleId] = useState<string>("");
    const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);

    // --- STATE: STEP 2 (MENU) ---
    const [menus, setMenus] = useState<Menu[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [newMenuName, setNewMenuName] = useState("");

    // --- STATE: STEP 3 (HEADING) ---
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [selectedHeading, setSelectedHeading] = useState<Heading | null>(null);
    const [newHeading, setNewHeading] = useState({ name: "", title: "", desc: "" });

    // --- STATE: STEP 4 (CHECKBOX & MAPPING) ---
    const [checkboxes, setCheckboxes] = useState<Checkbox[]>([]);
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [newCheckbox, setNewCheckbox] = useState({ label: "", value: "" });

    const [loading, setLoading] = useState(false);

    // ===========================================
    // STEP 1: MASTER SELECTION
    // ===========================================
    const handleLoadMaster = async () => {
        setLoading(true);
        try {
            const allMasters = await getAllMasters();
            // Find existing master or create one logic could be here.
            // For now, we filter by type/id
            const found = allMasters.find(
                (m) =>
                    m.module_type === moduleType &&
                    (moduleType === "global" ? true : Number(m.module_id) === Number(moduleId))
            );

            if (found) {
                setSelectedMaster(found);
                loadMenus(found.id);
            } else {
                // Create if not found? User requirement says "Master -> Menu..." flow.
                // Let's ask user to create or auto-create. For "Manager" view, maybe auto-create or explicit create button.
                setSelectedMaster(null);
                setMenus([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMaster = async () => {
        if (!moduleType) return;
        setLoading(true);
        try {
            const res = await createMaster({
                module_type: moduleType,
                module_id: moduleId ? Number(moduleId) : null,
            });
            const data = res.data || res;
            setSelectedMaster(data);
            loadMenus(data.id);
        } catch (err) {
            alert("Failed to create master");
        } finally {
            setLoading(false);
        }
    };

    // ===========================================
    // STEP 2: MENU
    // ===========================================
    const loadMenus = async (masterId: number) => {
        setLoading(true);
        try {
            const data = await getMenusByMaster(masterId);
            setMenus(data);
            setSelectedMenu(null);
            setHeadings([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMenu = async () => {
        if (!selectedMaster || !newMenuName.trim()) return;
        setLoading(true);
        try {
            await createMenu({
                menu_name: newMenuName,
            });
            setNewMenuName("");
            loadMenus(selectedMaster.id);
        } catch (err) {
            alert("Failed to add menu");
        } finally {
            setLoading(false);
        }
    };

    // ===========================================
    // STEP 3: HEADING
    // ===========================================
    const loadHeadings = async (menuId: number) => {
        setLoading(true);
        try {
            const data = await getHeadingsByMenu(menuId);
            setHeadings(data);
            setSelectedHeading(null);
            setMappings([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHeading = async () => {
        if (!selectedMenu || !newHeading.name.trim()) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("multitab_menu_id", selectedMenu.id.toString());
            formData.append("heading_name", newHeading.name);
            formData.append("title", newHeading.title);
            formData.append("description", newHeading.desc);

            await createHeading(formData);
            setNewHeading({ name: "", title: "", desc: "" });
            loadHeadings(selectedMenu.id);
        } catch (err) {
            alert("Failed to add heading");
        } finally {
            setLoading(false);
        }
    };

    // ===========================================
    // STEP 4: CHECKBOX & MAPPING
    // ===========================================
    const loadCheckboxesAndMappings = async (headingId: number) => {
        setLoading(true);
        try {
            const [allChecks, headingMaps] = await Promise.all([
                getCheckboxes(),
                getMappingByHeading(headingId),
            ]);
            setCheckboxes(allChecks);
            setMappings(headingMaps);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNewCheckbox = async () => {
        if (!newCheckbox.label.trim()) return;
        try {
            await createCheckbox({
                label: newCheckbox.label,
                value: newCheckbox.value || newCheckbox.label, // Auto-value
            });
            setNewCheckbox({ label: "", value: "" });
            // Refresh list
            const allChecks = await getCheckboxes();
            setCheckboxes(allChecks);
        } catch (err) {
            alert("Failed to create checkbox");
        }
    };

    const toggleMapping = async (checkId: number, currentMap: Mapping | undefined) => {
        if (!selectedHeading) return;

        if (currentMap) {
            // DELETE
            try {
                await deleteMapping(currentMap.id);
                setMappings((prev) => prev.filter((m) => m.id !== currentMap.id));
            } catch (err) {
                alert("Failed to remove mapping");
            }
        } else {
            // CREATE
            try {
                const res = await createMapping({
                    tab_heading_id: selectedHeading.id,
                    checkbox_id: checkId,
                    is_default: 0,
                });
                const data = res.data || res;
                setMappings((prev) => [...prev, data]);
            } catch (err) {
                alert("Failed to add mapping");
            }
        }
    };



    // ===========================================
    // RENDER
    // ===========================================
    return (
        <div className="page-container" style={{ padding: "20px", display: "grid", gap: "20px" }}>
            <h2>Modular Multitab Manager</h2>

            {/* STEP 1: MASTER */}
            <div className="unit-type-card" style={{ padding: "20px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FolderOpen size={20} /> Step 1: Select Master
                </h3>
                <div style={{ display: "flex", gap: "15px", marginTop: "15px", alignItems: "flex-end" }}>
                    <div className="form-group">
                        <label>Module Type</label>
                        <select
                            value={moduleType}
                            onChange={(e) => setModuleType(e.target.value as ModuleType)}
                            style={{ width: "200px" }}
                        >
                            <option value="global">Global</option>
                            <option value="category">Category</option>
                            <option value="sector">Sector</option>
                            <option value="subsector">SubSector</option>
                            <option value="brand">Brand</option>
                        </select>
                    </div>
                    {moduleType !== "global" && (
                        <div className="form-group">
                            <label>Module ID</label>
                            <input
                                type="number"
                                value={moduleId}
                                onChange={(e) => setModuleId(e.target.value)}
                                placeholder="ID (e.g. 1)"
                                style={{ width: "100px" }}
                            />
                        </div>
                    )}
                    <button className="btn-add-new-colour" onClick={handleLoadMaster}>
                        Load Master
                    </button>
                </div>

                {selectedMaster && (
                    <div style={{ marginTop: "10px", color: "green", fontWeight: "bold" }}>
                        ✅ Active Master: {selectedMaster.module_type.toUpperCase()} {selectedMaster.module_id ? `(#${selectedMaster.module_id})` : "(Global)"}
                    </div>
                )}
                {!selectedMaster && !loading && (
                    <div style={{ marginTop: "10px" }}>
                        <p>No master found for this combination.</p>
                        <button className="btn-save-unit" onClick={handleCreateMaster}>Create Master</button>
                    </div>
                )}
            </div>

            {/* STEP 2: MENUS */}
            {selectedMaster && (
                <div className="unit-type-card" style={{ padding: "20px" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <MenuIcon size={20} /> Step 2: Menus
                    </h3>
                    <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                        {/* List */}
                        <div style={{ flex: 1, borderRight: "1px solid #eee", paddingRight: "20px" }}>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {menus.map((m) => (
                                    <li
                                        key={m.id}
                                        onClick={() => {
                                            setSelectedMenu(m);
                                            loadHeadings(m.id);
                                        }}
                                        style={{
                                            padding: "10px",
                                            border: "1px solid #eee",
                                            marginBottom: "5px",
                                            cursor: "pointer",
                                            borderRadius: "4px",
                                            background: selectedMenu?.id === m.id ? "#e0e7ff" : "#fff",
                                            display: "flex",
                                            justifyContent: "space-between"
                                        }}
                                    >
                                        <span>{m.menu_name}</span>
                                        <span style={{ fontSize: '12px', color: '#777' }}>#{m.id}</span>
                                    </li>
                                ))}
                            </ul>
                            {menus.length === 0 && <p style={{ color: "#999" }}>No menus created yet.</p>}
                        </div>
                        {/* Create */}
                        <div style={{ width: "300px" }}>
                            <h4>Create Menu</h4>
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Menu Name"
                                    value={newMenuName}
                                    onChange={(e) => setNewMenuName(e.target.value)}
                                />
                            </div>
                            <button className="btn-add-new-colour" style={{ marginTop: '10px' }} onClick={handleAddMenu}>
                                <Plus size={16} /> Add Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: HEADINGS */}
            {selectedMenu && (
                <div className="unit-type-card" style={{ padding: "20px" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <List size={20} /> Step 3: Headings (in {selectedMenu.menu_name})
                    </h3>
                    <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                        {/* List */}
                        <div style={{ flex: 1, borderRight: "1px solid #eee", paddingRight: "20px" }}>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {headings.map((h) => (
                                    <li
                                        key={h.id}
                                        onClick={() => {
                                            setSelectedHeading(h);
                                            loadCheckboxesAndMappings(h.id);
                                        }}
                                        style={{
                                            padding: "10px",
                                            border: "1px solid #eee",
                                            marginBottom: "5px",
                                            cursor: "pointer",
                                            borderRadius: "4px",
                                            background: selectedHeading?.id === h.id ? "#dcfce7" : "#fff",
                                        }}
                                    >
                                        <div style={{ fontWeight: '600' }}>{h.heading_name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{h.title}</div>
                                    </li>
                                ))}
                            </ul>
                            {headings.length === 0 && <p style={{ color: "#999" }}>No headings created yet.</p>}
                        </div>
                        {/* Create */}
                        <div style={{ width: "300px" }}>
                            <h4>Create Heading</h4>
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Short Name (e.g. RAM)"
                                    value={newHeading.name}
                                    onChange={(e) => setNewHeading({ ...newHeading, name: e.target.value })}
                                    style={{ marginBottom: '10px' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Title (e.g. Select RAM)"
                                    value={newHeading.title}
                                    onChange={(e) => setNewHeading({ ...newHeading, title: e.target.value })}
                                    style={{ marginBottom: '10px' }}
                                />
                                <textarea
                                    placeholder="Description"
                                    value={newHeading.desc}
                                    onChange={(e) => setNewHeading({ ...newHeading, desc: e.target.value })}
                                    style={{ marginBottom: '10px', width: '100%', padding: '10px' }}
                                />
                            </div>
                            <button className="btn-add-new-colour" onClick={handleAddHeading}>
                                <Plus size={16} /> Add Heading
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: CHECKBOXES & MAPPING */}
            {selectedHeading && (
                <div className="unit-type-card" style={{ padding: "20px" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CheckSquare size={20} /> Step 4: Map Checkboxes (to {selectedHeading.heading_name})
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                        {/* CHECKBOX MASTER LIST */}
                        <div>
                            <h4>Available Checkboxes</h4>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <input
                                    placeholder="New Checkbox Label"
                                    value={newCheckbox.label}
                                    onChange={(e) => setNewCheckbox({ ...newCheckbox, label: e.target.value })}
                                    style={{ flex: 1 }}
                                />
                                <button className="btn-add-new-colour" style={{ padding: '5px 10px' }} onClick={handleCreateNewCheckbox}>Create</button>
                            </div>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' }}>
                                {checkboxes.map(cb => {
                                    const isMapped = mappings.find(m => m.checkbox_id === cb.id);
                                    return (
                                        <div key={cb.id}
                                            onClick={() => toggleMapping(cb.id, isMapped)}
                                            style={{
                                                padding: '8px',
                                                marginBottom: '4px',
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                background: isMapped ? '#eff6ff' : '#fff',
                                                border: isMapped ? '1px solid #2563eb' : '1px solid #eee',
                                                display: 'flex',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <span>{cb.label}</span>
                                            {isMapped && <Check size={16} color="#2563eb" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* MAPPED LIST PREVIEW */}
                        <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                            <h4>Current Mapping Configuration</h4>
                            <pre style={{ fontSize: '12px', color: '#555', marginTop: '10px' }}>
                                {JSON.stringify({
                                    menu: selectedMenu?.menu_name,
                                    headings: [
                                        {
                                            heading: selectedHeading.heading_name,
                                            options: mappings.map(m => {
                                                const cb = checkboxes.find(c => c.id === m.checkbox_id);
                                                return {
                                                    label: cb?.label || "Unknown",
                                                    default: m.is_default === 1
                                                }
                                            })
                                        }
                                    ]
                                }, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MultitabManager;
