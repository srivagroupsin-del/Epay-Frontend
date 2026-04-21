import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";
import "../addcolour/addColour.css"; // Reuse AddColour styles
import { updateColour, getColours } from "../models/colour.api";
import type { ColourPayload } from "../models/colour.api";

const EditColour = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState<ColourPayload>({
        name: "",
        status: "active",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* LOAD COLOUR DATA */
    useEffect(() => {
        const fetchColour = async () => {
            try {
                const colours = await getColours();
                const colour = colours.find(c => c.id === Number(id));
                if (colour) {
                    setForm({
                        name: colour.name,
                        status: colour.status,
                    });
                } else {
                    alert("Colour not found");
                    navigate("/variant/view-colour");
                }
            } catch (error: any) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchColour();
    }, [id, navigate]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Colour name is required");
            return;
        }

        try {
            setSaving(true);
            await updateColour(Number(id), form);
            alert("Colour updated successfully ✅");
            navigate("/variant/view-colour");
        } catch (error: any) {
            alert(error.message || "Failed to update colour ❌");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="add-colour-container"><p>Loading...</p></div>;

    return (
        <div className="add-colour-container">
            <div className="colour-card">
                <div className="colour-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={() => navigate("/variant/view-colour")}
                            style={{
                                background: "#e0e0e0",
                                color: "#333",
                                border: "none",
                                borderRadius: "4px",
                                width: "30px",
                                height: "30px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2>Edit Colour</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group-full">
                        <label>Colour</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter Colour"
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
                            {saving ? "Updating..." : "Update Colour"}
                        </button>
                        <button type="button" className="btn-reset-colour" onClick={() => navigate("/variant/view-colour")}>
                            Back to List
                        </button>
                        <button type="button" className="btn-cancel-colour" onClick={() => navigate("/variant/view-colour")}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditColour;
