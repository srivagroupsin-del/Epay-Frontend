import { useState, useEffect } from "react";
import { getDynamicPages, createDynamicPage, deleteDynamicPage, type DynamicPage } from "../../../api/dynamicForm.api";
import "./PageCreation.css";

const PageCreation = () => {
    const [pages, setPages] = useState<DynamicPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        folderName: "",
        routeLink: "",
        url: "",
        title: "",
        info: "",
        status: "active" as "active" | "inactive"
    });

    const loadPages = async () => {
        try {
            setLoading(true);
            const data = await getDynamicPages();
            setPages(data);
        } catch (err) {
            console.error("Failed to load pages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPages();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!form.folderName || !form.title) {
            alert("Folder Name and Title are required");
            return;
        }

        try {
            await createDynamicPage({
                folder_name: form.folderName,
                route_link: form.routeLink,
                url: form.url,
                title: form.title,
                info: form.info,
                status: form.status
            });
            alert("Page Information Saved! ✅");
            setForm({
                folderName: "",
                routeLink: "",
                url: "",
                title: "",
                info: "",
                status: "active"
            });
            loadPages();
        } catch (err) {
            alert("Failed to save page information");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this page?")) return;
        try {
            await deleteDynamicPage(id);
            alert("Page deleted successfully ✅");
            loadPages();
        } catch (err) {
            alert("Failed to delete page");
        }
    };

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
            setForm({
                folderName: "",
                routeLink: "",
                url: "",
                title: "",
                info: "",
                status: "active"
            });
        }
    };

    return (
        <div className="page-container page-creation-container">
            <div className="page-creation-card">
                <div className="page-creation-header">
                    <h3>Add page creation</h3>
                </div>

                <div className="page-creation-body">
                    <div className="page-creation-grid">
                        <div className="page-creation-group">
                            <label>Folder Name</label>
                            <input
                                name="folderName"
                                placeholder="Folder Name"
                                value={form.folderName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="page-creation-group">
                            <label>Route Link</label>
                            <input
                                name="routeLink"
                                placeholder="e.g. /about or /blog/post"
                                value={form.routeLink}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="page-creation-group">
                            <label>URL</label>
                            <input
                                name="url"
                                placeholder="https://example.com"
                                value={form.url}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="page-creation-group">
                            <label>Title</label>
                            <input
                                name="title"
                                placeholder="Enter title"
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="page-creation-group" style={{ marginBottom: "25px" }}>
                        <label>Info</label>
                        <textarea
                            name="info"
                            placeholder="Enter details or description..."
                            value={form.info}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="page-creation-group" style={{ width: "100%", maxWidth: "100%" }}>
                        <label>Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="page-creation-actions">
                        <button className="btn-cancel-page" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className="btn-save-page" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="page-creation-card" style={{ marginTop: "30px" }}>
                <div className="page-creation-header">
                    <h3>Page Information List</h3>
                </div>
                <div className="page-creation-body" style={{ padding: "0" }}>
                    <div className="table-responsive">
                        <table className="page-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Folder Name</th>
                                    <th>Route Link</th>
                                    <th>URL</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                                            Loading pages...
                                        </td>
                                    </tr>
                                )}
                                {!loading && pages.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td>{p.folder_name}</td>
                                        <td>{p.route_link}</td>
                                        <td>{p.url}</td>
                                        <td>{p.title}</td>
                                        <td>
                                            <span className={`status-badge ${p.status}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-delete-page"
                                                onClick={() => handleDelete(p.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && pages.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                                            No page information available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageCreation;
