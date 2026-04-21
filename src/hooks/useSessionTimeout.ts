import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    isSessionExpired, 
    clearSession, 
    getRemainingSessionTime,
    refreshSession 
} from '../utils/sessionManager';

/**
 * Custom hook for managing session timeout
 * - Checks session on app load
 * - Handles auto logout when session expires
 * - Provides countdown timer functionality
 * - Refreshes session on user activity
 */
export const useSessionTimeout = () => {
    const navigate = useNavigate();
    const [remainingTime, setRemainingTime] = useState(getRemainingSessionTime());
    const [isExpired, setIsExpired] = useState(isSessionExpired());

    // Check session and logout if expired
    const checkSession = useCallback(() => {
        if (isSessionExpired()) {
            clearSession();
            setIsExpired(true);
            navigate('/login', { replace: true });
            return false;
        }
        setIsExpired(false);
        return true;
    }, [navigate]);

    // Logout function
    const logout = useCallback(() => {
        clearSession();
        navigate('/login', { replace: true });
    }, [navigate]);

    // Refresh session timestamp
    const extendSession = useCallback(() => {
        refreshSession();
        setRemainingTime(getRemainingSessionTime());
    }, []);

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Countdown timer for remaining session time
    useEffect(() => {
        if (isExpired) return;

        const interval = setInterval(() => {
            const time = getRemainingSessionTime();
            setRemainingTime(time);

            if (time <= 0) {
                clearSession();
                setIsExpired(true);
                navigate('/login', { replace: true });
            }
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [isExpired, navigate]);

    // Activity listener to extend session
    useEffect(() => {
        const handleActivity = () => {
            if (!isSessionExpired()) {
                extendSession();
            }
        };

        // Listen for user activity events
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [extendSession]);

    return {
        remainingTime,
        isExpired,
        logout,
        extendSession,
        checkSession
    };
};

export default useSessionTimeout;
