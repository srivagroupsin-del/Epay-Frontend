import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import "./SuccessPopup.css";

interface SuccessPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({
    isOpen,
    onClose,
    title = "Success!",
    message = "Your settings have been saved"
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="popup-overlay">
                    <motion.div
                        className="popup-overlay-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="popup-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button className="popup-close-x" onClick={onClose}>
                            <X size={18} />
                        </button>

                        <div className="success-icon-container">
                            <CheckCircle2 size={48} className="success-icon-svg" />
                        </div>

                        <h2 className="popup-title-text">{title}</h2>
                        <p className="popup-subtitle-text">{message}</p>

                        <button className="popup-action-btn" onClick={onClose}>
                            Awesome!
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SuccessPopup;
