import { useState } from "react";
import { Check } from "lucide-react";
import "../addcolour/addColour.css"; // Reuse existing styles
import { createField } from "../models/field.api";
import type { FieldPayload } from "../models/field.api";

const AddField = () => {
    const [form, setForm] = useState<FieldPayload>({
        name: "",
        status: "active",
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            name: "",
            status: "active",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Field name is required");
            return;
        }

        try {
            setSaving(true);
            await createField(form);
            alert("Field saved successfully ✅");
            resetForm();
        } catch (error: any) {
            alert(error.message || "Failed to save field ❌");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-colour-container">
            <div className="colour-card">
                <div className="colour-header">
                    <h2>Add Field</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group-full">
                        <label>Field Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter Field Name"
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="status-row">
                        <label>Status</label>
                        <div
                            className={`custom-checkbox ${form.status === "inactive" ? "inactive" : ""}`}
                            onClick={toggleStatus}
                        >
                            {form.status === "active" && <Check size={24} />}
                        </div>
                    </div>

                    <div className="colour-form-actions">
                        <button type="submit" className="btn-save-colour" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button type="button" className="btn-reset-colour" onClick={resetForm}>
                            Reset
                        </button>
                        <button type="button" className="btn-cancel-colour">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddField;
