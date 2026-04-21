import { useLoading } from "../../context/LoadingContext";
import "./LoadingOverlay.css";

const LoadingOverlay = () => {
    const { isLoading, loadingMessage } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="loading-overlay" role="status" aria-live="polite" aria-label="Loading">
            <div className="loading-box">
                {/* ─── Spinner ─── */}
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring spinner-ring--2"></div>
                    <div className="spinner-ring spinner-ring--3"></div>
                </div>

                {/* ─── Message ─── */}
                <p className="loading-message">{loadingMessage}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
