import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";
import "../addtax/addTax.css";
import { updateTax, getTaxes } from "../models/tax.api";
import type { TaxPayload } from "../models/tax.api";

const EditTax = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState<TaxPayload>({
        menu_id: "",
        name: "",
        value: "",
        status: "active",
    });



    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* LOAD TAX DATA */
    useEffect(() => {
        const fetchTax = async () => {
            try {
                const taxes = await getTaxes();
                
                const tax = taxes.find(t => t.id === Number(id));
                if (tax) {
                    setForm({
                        menu_id: tax.menu_id ? String(tax.menu_id) : "",
                        name: tax.name,
                        value: tax.value,
                        status: (tax.status === "inactive" || tax.status === 0 || tax.status === "0") ? "inactive" : "active",
                    });
                } else {
                    alert("Tax not found");
                    navigate("/variant/add-tax");
                }
            } catch (error: any) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTax();
    }, [id, navigate]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Tax name is required");
            return;
        }

        try {
            setSaving(true);
            await updateTax(Number(id), form);
            alert("Tax updated successfully ✅");
            navigate("/variant/add-tax");
        } catch (error: any) {
            alert(error.message || "Failed to update tax ❌");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="add-unit-type-container"><p>Loading...</p></div>;

    return (
        <div className="add-unit-type-container">
            <div className="unit-type-card">
                <div className="add-unit-type-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={() => navigate("/variant/add-tax")}
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
                        <h2>Edit Tax</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "25px" }}>
                        <div className="form-group">
                            <label>TAX</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter TAX Name"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>TAX (%)</label>
                            <input
                                type="text"
                                name="value"
                                placeholder="0"
                                value={form.value}
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
                            {saving ? "Updating..." : "Update Tax"}
                        </button>
                        <button type="button" className="btn-reset-unit" onClick={() => navigate("/variant/add-tax")}>
                            Back to List
                        </button>
                        <button type="button" className="btn-cancel-unit" onClick={() => navigate("/variant/add-tax")}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTax;
