import React, { useState } from "react";

interface ProductFormData {
  name: string;
  category: string;
  price: number;
}

/**
 * Interactive Form Module Sample
 * Demonstrates a component handling user inputs, dropdowns, state, and form submissions.
 */
const SampleFormModule: React.FC = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    price: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Form Submitted!\nProduct: ${formData.name}\nCategory: ${formData.category}\nPrice: $${formData.price}`);
  };

  return (
    <div style={{
      padding: "24px",
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      fontFamily: "system-ui, sans-serif",
      maxWidth: "400px"
    }}>
      <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "18px" }}>
        📝 Interactive Form Module
      </h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px" }}>
            PRODUCT NAME
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            required
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px" }}>
            CATEGORY
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", boxSizing: "border-box" }}
            required
          >
            <option value="">Select Category</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="groceries">Groceries</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "5px", letterSpacing: "0.5px" }}>
            PRICE ($)
          </label>
          <input
            type="number"
            value={formData.price || ""}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            placeholder="0.00"
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            required
          />
        </div>
        <button
          type="submit"
          style={{
            background: "#4f46e5",
            color: "#fff",
            padding: "12px",
            borderRadius: "6px",
            border: "none",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "10px",
            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
          }}
        >
          Submit Product
        </button>
      </form>
    </div>
  );
};

export default SampleFormModule;
