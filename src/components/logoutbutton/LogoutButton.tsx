import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../../utils/sessionManager';

/**
 * LogoutButton Component
 * Provides a button to manually logout the user
 * Clears session data and redirects to login page
 */
interface LogoutButtonProps {
    onLogout?: () => void;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
    onLogout, 
    children = 'Logout', 
    className = '',
    style = {} 
}) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear all session data
        clearSession();
        
        // Call optional callback
        if (onLogout) {
            onLogout();
        }
        
        // Redirect to login page
        navigate('/login', { replace: true });
    };

    return (
        <button
            onClick={handleLogout}
            className={className}
            style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                ...style
            }}
        >
            {children}
        </button>
    );
};

export default LogoutButton;
