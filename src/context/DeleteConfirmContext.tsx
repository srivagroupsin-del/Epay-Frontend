import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import "./DeleteConfirmModal.css";

interface DeleteConfirmContextType {
    confirmDelete: (onConfirm: () => void, message?: string) => void;
}

const DeleteConfirmContext = createContext<DeleteConfirmContextType>({
    confirmDelete: () => { },
});

export const DeleteConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("Are you sure you want to delete this item?");
    const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

    const confirmDelete = useCallback((onConfirm: () => void, msg = "Are you sure you want to delete this item?") => {
        setOnConfirmCallback(() => onConfirm);
        setMessage(msg);
        setVisible(true);
    }, []);

    const handleConfirm = () => {
        if (onConfirmCallback) {
            onConfirmCallback();
        }
        setVisible(false);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    return (
        <DeleteConfirmContext.Provider value={{ confirmDelete }}>
            {children}
            {visible && (
                <div className="dc-overlay" onClick={handleCancel}>
                    <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dc-icon-container">
                            <div className="dc-icon-ring">
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </div>
                        </div>

                        <div className="dc-content">
                            <h3 className="dc-title">Confirm Delete</h3>
                            <p className="dc-message">{message}</p>
                        </div>

                        <div className="dc-actions">
                            <button className="dc-btn-cancel" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="dc-btn-delete" onClick={handleConfirm}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DeleteConfirmContext.Provider>
    );
};

export const useDeleteConfirm = () => useContext(DeleteConfirmContext);
