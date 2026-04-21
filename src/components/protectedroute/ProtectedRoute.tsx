import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isSessionExpired, clearSession } from '../../utils/sessionManager';

const ProtectedRoute = () => {
    // Check if token exists
    const token = localStorage.getItem("token");

    // Check if session has expired
    const sessionExpired = isSessionExpired();

    useEffect(() => {
        if (sessionExpired) {
            // Clear all session data
            clearSession();
        }
    }, [sessionExpired]);

    // If no token or session expired, redirect to login
    if (!token || sessionExpired) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
