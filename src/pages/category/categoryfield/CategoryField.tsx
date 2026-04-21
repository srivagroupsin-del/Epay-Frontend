import React, { useState, useEffect } from "react";
import "./categoryField.css";
import { getSectorTitles, type SectorTitle } from "../../../api/sectorTitle.api";

const CategoryField: React.FC = () => {
    const [sectorTitles, setSectorTitles] = useState<SectorTitle[]>([]);
    const [selectedTitleId, setSelectedTitleId] = useState<number | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [itemName, setItemName] = useState("");
    const [hsnCode, setHsnCode] = useState("");
    const [isGstEnabled, setIsGstEnabled] = useState(false);
    const [gstPercent, setGstPercent] = useState("");

    useEffect(() => {
        getSectorTitles()
            .then(setSectorTitles)
            .catch((err: any) => console.error("Failed to load titles", err));
    }, []);

    const handleReset = () => {
        setItemName("");
        setHsnCode("");
        setIsGstEnabled(false);
        setGstPercent("");
    };

    const handleSave = () => {
        const payload = {
            sector_title_id: selectedTitleId,
            item_name: itemName,
            hsn_code: hsnCode,
            gst_enabled: isGstEnabled,
            gst_percent: gstPercent
        };
        console.log("Saving Category Field:", payload);
        alert("Saved successfully! ✅");
    };

    return (
        <div className="page-container">
            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h2>Category Field</h2>
                    <p className="subtitle">Configure category specific fields and GST</p>
                </div>
            </div>

            <div className="category-field-layout">

                {/* LEFT COLUMN */}
                <div className="category-field-left">
                    <label className="category-field-label">Sector Title Menu</label>
                    <button
                        type="button"
                        className="select-btn-grey"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {selectedTitleId
                            ? sectorTitles.find(t => t.id === selectedTitleId)?.title
                            : "Select"
                        }
                        <span style={{ fontSize: '10px' }}>{showDropdown ? '▲' : '▼'}</span>
                    </button>

                    {showDropdown && (
                        <div className="dropdown-list">
                            {sectorTitles.map(title => (
                                <div
                                    key={title.id}
                                    className="dropdown-item"
                                    onClick={() => {
                                        setSelectedTitleId(title.id);
                                        setItemName(title.title);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {title.title}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="category-field-right">
                    <div className="config-card">

                        <div className="config-header">
                            <label>Category Name</label>
                            <div className="gst-toggle">
                                <input
                                    type="checkbox"
                                    className="gst-checkbox"
                                    checked={isGstEnabled}
                                    onChange={(e) => setIsGstEnabled(e.target.checked)}
                                />
                                <span>GST</span>
                            </div>
                        </div>

                        <div className="config-input-group">
                            <input
                                type="text"
                                className="config-input"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                placeholder="Enter Category Name..."
                            />
                        </div>

                        <div className="config-input-group">
                            <input
                                type="text"
                                className="config-input"
                                value={hsnCode}
                                onChange={(e) => setHsnCode(e.target.value)}
                                placeholder="Enter HSN Code..."
                            />
                        </div>

                        <div className="config-input-group">
                            <select
                                className="config-select"
                                value={gstPercent}
                                onChange={(e) => setGstPercent(e.target.value)}
                            >
                                <option value="" disabled>Select GST (%)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>

                        <div className="config-actions">
                            <button className="pill-btn btn-save" onClick={handleSave}>save</button>
                            <button className="pill-btn btn-reset" onClick={handleReset}>Reset</button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default CategoryField;
