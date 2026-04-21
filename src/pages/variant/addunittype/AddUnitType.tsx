import { useState } from "react";
import { Check, Plus } from "lucide-react";
import "./addUnitType.css";
import { createUnitType } from "../models/unitType.api";
import type { UnitTypePayload } from "../models/unitType.api";

const AddUnitType = () => {
    const [form, setForm] = useState<UnitTypePayload>({
        type: "",
        name: "",
        status: "active",
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleStatus = () => {
        setForm(prev => ({
            ...prev,
            status: prev.status === "active" ? "inactive" : "active"
        }));
    };

    const resetForm = () => {
        setForm({
            type: "",
            name: "",
            status: "active",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.type) {
            alert("Please select Unit Type");
            return;
        }

        if (!form.name.trim()) {
            alert("Unit Name is required");
            return;
        }

        try {
            setSaving(true);
            await createUnitType(form);
            alert("Unit Type saved successfully ✅");
            resetForm();
        } catch (error: any) {
            alert(error.message || "Failed to save unit type ❌");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-unit-type-container">
            <div className="add-unit-type-header">
                <h2>Add Unit Type</h2>
                <button className="btn-header-add">
                    <Plus size={18} /> Add New Unit Type
                </button>
            </div>

            <div className="unit-type-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Unit Type</label>
                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                            >
                                <option value="">Select Unit Type</option>
                                <option value="Weight">Weight</option>
                                <option value="Volume">Volume</option>
                                <option value="Length">Length</option>
                                <option value="Pieces">Pieces</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Unit Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter Unit Name"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="status-row-fixed">
                        <span className="status-label-fixed">Status</span>
                        <div
                            className={`blue-square-checkbox ${form.status === "inactive" ? "inactive" : ""}`}
                            onClick={toggleStatus}
                        >
                            {form.status === "active" && <Check size={24} />}
                        </div>
                    </div>

                    <div className="form-actions-centered">
                        <button type="submit" className="btn-save-unit" disabled={saving}>
                            {saving ? "Saving..." : "Save Unit type"}
                        </button>
                        <button type="button" className="btn-reset-unit" onClick={resetForm}>
                            Reset
                        </button>
                        <button type="button" className="btn-cancel-unit">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUnitType;
