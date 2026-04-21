import { useState, useEffect } from "react";
import { 
    HelpCircle, 
    Box, 
    Layers, 
    Users, 
    Cpu, 
    Activity, 
    ShoppingBag, 
    Bookmark, 
    Tag,
    Save
} from "lucide-react";
import "./addPreviewTabs.css";
import { getMenus, type Menu } from "../../../../api/multitab/menu.api";

// Helper to assign icons based on menu name
const getMenuIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("product")) return <ShoppingBag size={18} />;
    if (n.includes("relative")) return <Users size={18} />;
    if (n.includes("category")) return <Layers size={18} />;
    if (n.includes("circuit") || n.includes("point")) return <Cpu size={18} />;
    if (n.includes("xcp") || n.includes("activity")) return <Activity size={18} />;
    return <Box size={18} />;
};

const tabButtons = [
    { id: "stock", label: "Stock", icon: <Box size={16} /> },
    { id: "book", label: "BOOK", icon: <Bookmark size={16} /> },
    { id: "brand", label: "Brand", icon: <Tag size={16} /> },
];

const checkboxOptions = [
    { id: "cicyle", label: "Cicyle" },
    { id: "laptop", label: "Laptop" },
    { id: "phone", label: "Phone" },
];

const AddPreviewTabs = () => {
    // UI State
    const [menus, setMenus] = useState<Menu[]>([]);
    const [selectedSidebar, setSelectedSidebar] = useState<number | string>("");
    const [activeTab, setActiveTab] = useState("stock");
    const [searchText, setSearchText] = useState("");
    const [selectedChips, setSelectedChips] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch dynamic menus
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const data = await getMenus();
                setMenus(data);
                if (data.length > 0) {
                    setSelectedSidebar(data[0].id);
                }
            } catch (error) {
                console.error("Error fetching menus:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenus();
    }, []);

    const handleSave = () => {
        console.log("Saving configuration:", {
            selectedSidebar,
            activeTab,
            searchText,
            selectedChips,
        });
        alert("Configuration saved successfully!");
    };
    const handleChipToggle = (id: string) => {
        if (selectedChips.includes(id)) {
            setSelectedChips(prev => prev.filter(c => c !== id));
        } else {
            setSelectedChips(prev => [...prev, id]);
        }
    };

    return (
        <div className="preview-tabs-container">
            {/* Sidebar Left Panel */}
            <aside className="preview-sidebar-panel">
                <h2 className="preview-sidebar-title">Sector Title Menu</h2>
                <nav className="preview-sidebar-menu">
                    {loading ? (
                        <div style={{ padding: "12px", fontSize: "12px", color: "#64748b" }}>Loading...</div>
                    ) : (
                        menus.map(menu => (
                            <div
                                key={menu.id}
                                className={`preview-sidebar-item ${selectedSidebar === menu.id ? "active" : ""}`}
                                onClick={() => setSelectedSidebar(menu.id)}
                            >
                                {getMenuIcon(menu.menu_name)}
                                <span>{menu.menu_name}</span>
                            </div>
                        ))
                    )}
                </nav>
            </aside>

            {/* Main Content Right Panel */}
            <main className="main-content">
                <div className="content-header">
                    <div className="breadcrumb">
                        Sector Title Multitab &rArr; Preview &rArr; Sector Preview Tabs
                    </div>
                    <h1 className="page-title">Sector Preview Tabs</h1>
                </div>

                {/* Search Input Area */}
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="modern-input"
                        placeholder={`${tabButtons.find(t => t.id === activeTab)?.label.toLowerCase() || 'item'} is check`}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                {/* Selection Horizontal Group */}
                <div className="selection-tabs">
                    {tabButtons.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Bordered Card Section */}
                <section className="content-card">
                    <header className="card-header">
                        <h3>{tabButtons.find(t => t.id === activeTab)?.label.toLowerCase() || 'item'} is check</h3>
                        <HelpCircle size={18} className="help-icon" />
                    </header>
                    <div className="card-body">
                        <div className="chip-group">
                            {checkboxOptions.map(option => (
                                <button
                                    key={option.id}
                                    className={`chip ${selectedChips.includes(option.id) ? "selected" : ""}`}
                                    onClick={() => handleChipToggle(option.id)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Save Action Area */}
                <div className="action-area">
                    <button className="btn-save" onClick={handleSave}>
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AddPreviewTabs;
