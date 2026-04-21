import "./SuccessPopup.css";
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface SuccessPopupContextType {
    showSuccess: (message?: string, title?: string) => void;
    showDeleteSuccess: (message?: string, title?: string) => void;
}

const SuccessPopupContext = createContext<SuccessPopupContextType>({
    showSuccess: () => { },
    showDeleteSuccess: () => { },
});

export const SuccessPopupProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [type, setType] = useState<"success" | "delete">("success");
    const [title, setTitle] = useState("Saved Successfully!");
    const [message, setMessage] = useState("Your changes have been saved.");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showSuccess = useCallback((msg = "Your changes have been saved.", ttl = "Saved Successfully!") => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setType("success");
        setTitle(ttl);
        setMessage(msg);
        setVisible(true);
        timerRef.current = setTimeout(() => setVisible(false), 2500);
    }, []);

    const showDeleteSuccess = useCallback((msg = "Deleted Successfully!", ttl = "Record Deleted") => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setType("delete");
        setTitle(ttl);
        setMessage(msg);
        setVisible(true);
        timerRef.current = setTimeout(() => setVisible(false), 2500);
    }, []);

    const handleClose = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(false);
    }, []);

    return (
        <SuccessPopupContext.Provider value={{ showSuccess, showDeleteSuccess }}>
            {children}
            {visible && (
                <div className="sp-overlay" onClick={handleClose} aria-modal="true" role="dialog">
                    <div className={`sp-card ${type}`} onClick={(e) => e.stopPropagation()}>
                        <button className="sp-close" onClick={handleClose} aria-label="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className={`sp-icon-ring ${type}`}>
                            {type === "success" ? (
                                <svg className="sp-checkmark" viewBox="0 0 52 52" fill="none">
                                    <circle className="sp-circle" cx="26" cy="26" r="24" stroke="#22c55e" strokeWidth="3" fill="none" />
                                    <path className="sp-check" d="M14 26.5l8 8 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            ) : (
                                <svg className="sp-checkmark" viewBox="0 0 52 52" fill="none">
                                    <circle className="sp-circle" cx="26" cy="26" r="24" stroke="#ef4444" strokeWidth="3" fill="none" />
                                    <path className="sp-trash-icon" d="M16 18l1.5 20c.1 1.1 1 2 2.1 2h12.8c1.1 0 2-.9 2.1-2L36 18M14 14h24M22 14v-2c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2M24 22v12M28 22v12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            )}
                        </div>

                        <h2 className="sp-title">{title}</h2>
                        <p className="sp-message">{message}</p>

                        <div className={`sp-progress-bar ${type}`}>
                            <div className={`sp-progress-fill ${type}`} />
                        </div>

                        <button className={`sp-btn ${type}`} onClick={handleClose}>
                            {type === "success" ? "Awesome!" : "Got it!"}
                        </button>
                    </div>
                </div>
            )}
        </SuccessPopupContext.Provider>
    );
};

export const useSuccessPopup = () => useContext(SuccessPopupContext);
