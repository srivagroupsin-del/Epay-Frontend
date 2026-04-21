import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    isSessionExpired,
    clearSession,
    getRemainingSessionTime,
    getFormattedRemainingTime
} from '../../utils/sessionManager';

/**
 * SessionProvider Component
 * Wraps the application to handle session validation on every app load
 * Provides auto-logout functionality when session expires
 */
interface SessionProviderProps {
    children: React.ReactNode;
}

const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);

    // Check session on app load
    const checkSession = useCallback(() => {
        if (isSessionExpired()) {
            clearSession();
            navigate('/login', { replace: true });
            return false;
        }
        return true;
    }, [navigate]);

    // Initialize session check on mount
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            const time = getRemainingSessionTime();

            // Show warning when 5 minutes or less remaining
            if (time <= 5 * 60 * 1000 && time > 0) {
                setShowWarning(true);
            }

            // Auto logout when time expires
            if (time <= 0) {
                clearSession();
                navigate('/login', { replace: true });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate]);

    // Activity listener to reset warning
    useEffect(() => {
        const handleActivity = () => {
            if (!isSessionExpired()) {
                setShowWarning(false);
            }
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, []);

    return (
        <>
            {children}
            {/* Session Timeout Warning Banner */}
            {showWarning && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '10px 20px',
                    textAlign: 'center',
                    zIndex: 9999,
                    borderTop: '1px solid #ffeeba',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span>⚠️ Your session will expire in </span>
                    <strong>{getFormattedRemainingTime()}</strong>
                    <span>. Please save your work.</span>
                </div>
            )}
        </>
    );
};

export default SessionProvider;
