import React, { useState, useEffect } from "react";
import { LayoutDashboard } from "lucide-react";
import LoadingOverlay from "../../components/loading-overlay/LoadingOverlay";
import SuccessPopup from "../../components/success-popup/SuccessPopup";

const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Simulate initial data fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loading for 2 seconds
    return () => clearTimeout(timer);
  }, []);


  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="Processing your request..." />
      <SuccessPopup
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      <div className="page-container" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 160px)",
        textAlign: "center",
        padding: "40px"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "var(--primary-light, #f0f4ff)",
          borderRadius: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          color: "var(--primary, #4f46e5)"
        }}>
          <LayoutDashboard size={40} />
        </div>

        <h2 style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "var(--text-dark, #1e293b)",
          marginBottom: "12px"
        }}>
          Welcome to Your Dashboard
        </h2>

        {/* <button
          className="btn-primary"
          onClick={handleTestSave}
          style={{
            marginTop: "24px",
            padding: "12px 24px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Save size={18} /> Demo Save Action
        </button> */}

        {/* Decorative background elements */}
        <div style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, var(--primary-light, #f0f4ff) 0%, transparent 70%)",
          zIndex: -1,
          opacity: 0.5
        }} />
        <div style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, #e0f2fe 0%, transparent 70%)",
          zIndex: -1,
          opacity: 0.5
        }} />
      </div>
    </>
  );
};

export default LandingPage;
