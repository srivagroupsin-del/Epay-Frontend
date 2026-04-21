import React, { useState, useEffect, useRef } from "react";
import CustomDropdown from "../../../components/common/CustomDropdown/CustomDropdown";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlobalStoreHeader from "../../../components/common/GlobalStoreHeader";
import { useBusinessStore } from "../../../store/useBusinessStore";
import { useCategoryStore } from "../../../store/useCategoryStore";
import "./EditPage.css"; // We'll create a basic CSS for this example


const EditPage: React.FC = () => {
    const navigate = useNavigate();

    // 1. STATE MANAGEMENT: Track which dropdown is currently active
    // This solves the requirement: "Only one dropdown should be open at a time"
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Form data state
    const [formData, setFormData] = useState({
        sectorTitle: "",
        sector: "",
        subSector: "",
        categoryType: "Primary",
        categoryName: "",
        status: "Active"
    });

    // Dummy Options Data
    const sectorTitles = [
        { id: 1, label: "Electronics & Gadgets" },
        { id: 2, label: "Fashion & Lifestyle" },
        { id: 3, label: "Home & Kitchen" },
        { id: 4, label: "Services" }
    ];

    const sectors = [
        { id: 101, label: "Smartphones" },
        { id: 102, label: "Laptops" },
        { id: 103, label: "Men's Clothing" },
        { id: 104, label: "Women's Clothing" }
    ];

    const subSectors = [
        { id: 201, label: "iPhone" },
        { id: 202, label: "Gaming Laptops" },
        { id: 203, label: "Formal Shirts" }
    ];

    // 2. OUTSIDE CLICK DETECTION
    // This solves: "Close dropdown when clicking outside"
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. TOGGLE HANDLER
    const toggleDropdown = (key: string) => {
        setActiveDropdown(activeDropdown === key ? null : key);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Saving Data:", formData);
        alert("Data Saved Successfully!");
    };

    return (
        <div className="edit-page-container">
            <GlobalStoreHeader />

            <form className="edit-form-card" ref={formRef} onSubmit={handleSave}>
                {/* Header Area */}
                <div className="edit-header">
                    <div className="header-left">
                        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="title-box">
                            <h1>Edit Category Configuration</h1>
                            <p>Update your category details and mapping settings</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button type="submit" className="save-btn">
                            <Save size={18} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="edit-content-grid">

                    {/* CUSTOM DROPDOWNS SECTION */}
                    <div className="form-section">
                        <h3 className="section-title">Hierarchy Settings</h3>
                        <div className="dropdown-grid">

                            <CustomDropdown
                                label="Sector Title"
                                options={sectorTitles}
                                value={formData.sectorTitle}
                                onChange={(id) => {
                                    setFormData({ ...formData, sectorTitle: String(id) });
                                    const label = sectorTitles.find(st => String(st.id) === String(id))?.label;
                                    if (label) useBusinessStore.getState().setBusiness(label);
                                }}

                                isOpen={activeDropdown === 'sectorTitle'}
                                onToggle={() => toggleDropdown('sectorTitle')}
                                required
                                placeholder="Select Sector Title"
                            />

                            <CustomDropdown
                                label="Sector"
                                options={sectors}
                                value={formData.sector}
                                onChange={(id) => {
                                    setFormData({ ...formData, sector: String(id) });
                                    const label = sectors.find(s => String(s.id) === String(id))?.label;
                                    if (label) useBusinessStore.getState().setBusiness(label);
                                }}

                                isOpen={activeDropdown === 'sector'}
                                onToggle={() => toggleDropdown('sector')}
                                required
                                placeholder="Select Sector"
                                disabled={!formData.sectorTitle}
                            />

                            <CustomDropdown
                                label="Sub Sector"
                                options={subSectors}
                                value={formData.subSector}
                                onChange={(id) => {
                                    setFormData({ ...formData, subSector: String(id) });
                                    const label = subSectors.find(ss => String(ss.id) === String(id))?.label;
                                    if (label) useBusinessStore.getState().setBusiness(label);
                                }}

                                isOpen={activeDropdown === 'subSector'}
                                onToggle={() => toggleDropdown('subSector')}
                                placeholder="Select Sub Sector (Optional)"
                                disabled={!formData.sector}
                            />
                        </div>
                    </div>

                    {/* BASIC INFO SECTION */}
                    <div className="form-section">
                        <h3 className="section-title">Basic Information</h3>
                        <div className="input-group">
                            <label className="input-label">Category Name *</label>
                            <input
                                type="text"
                                className="premium-text-input"
                                placeholder="e.g. Premium Smartphones"
                                value={formData.categoryName}
                                onChange={(e) => {
                                    setFormData({ ...formData, categoryName: e.target.value });
                                    useCategoryStore.getState().setCategory(e.target.value);
                                }}

                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <div className="radio-group">
                                {['Active', 'Inactive'].map(status => (
                                    <label key={status} className={`radio-item ${formData.status === status ? 'checked' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value={status}
                                            checked={formData.status === status}
                                            onChange={() => setFormData({ ...formData, status })}
                                        />
                                        <span>{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditPage;
