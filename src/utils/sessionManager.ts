/**
 * Session Management Utility
 * Handles login timestamp storage and session timeout validation
 */

// Session timeout in milliseconds (24 hours = 24 * 60 * 60 * 1000)
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// Storage keys
const LOGIN_TIMESTAMP_KEY = 'loginTimestamp';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Get the stored login timestamp
 * @returns {number | null} Unix timestamp in milliseconds or null if not set
 */
export const getLoginTimestamp = (): number | null => {
    const timestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
};

/**
 * Set the login timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 */
export const setLoginTimestamp = (timestamp: number): void => {
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, timestamp.toString());
};

/**
 * Get stored token
 * @returns {string | null} Token string or null if not set
 */
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set token
 * @param {string} token - JWT token string
 */
export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get stored user data
 * @returns {object | null} User object or null if not set
 */
export const getUser = (): object | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

/**
 * Set user data
 * @param {object} user - User object to store
 */
export const setUser = (user: object): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Check if session has expired
 * @returns {boolean} True if session has expired, false otherwise
 */
export const isSessionExpired = (): boolean => {
    const loginTimestamp = getLoginTimestamp();
    
    if (!loginTimestamp) {
        // No login timestamp found, session is considered expired
        return true;
    }
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - loginTimestamp;
    
    return elapsedTime > SESSION_TIMEOUT;
};

/**
 * Get remaining session time in milliseconds
 * @returns {number} Remaining time in milliseconds (0 if expired)
 */
export const getRemainingSessionTime = (): number => {
    const loginTimestamp = getLoginTimestamp();
    
    if (!loginTimestamp) {
        return 0;
    }
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - loginTimestamp;
    const remainingTime = SESSION_TIMEOUT - elapsedTime;
    
    return Math.max(0, remainingTime);
};

/**
 * Get remaining session time in formatted string
 * @returns {string} Formatted time string (HH:MM:SS) or "Expired"
 */
export const getFormattedRemainingTime = (): string => {
    const remainingTime = getRemainingSessionTime();
    
    if (remainingTime <= 0) {
        return 'Expired';
    }
    
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Clear all session data (logout)
 */
export const clearSession = (): void => {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated (has valid token and session not expired)
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
    const token = getToken();
    const isExpired = isSessionExpired();
    
    return !!token && !isExpired;
};

/**
 * Initialize session after successful login
 * Stores token, user data, and login timestamp
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
export const initializeSession = (token: string, user: object): void => {
    setToken(token);
    setUser(user);
    setLoginTimestamp(Date.now());
};

/**
 * Refresh session timestamp (extend session on user activity)
 * Should be called on user activity to keep session alive
 */
export const refreshSession = (): void => {
    if (!isSessionExpired()) {
        setLoginTimestamp(Date.now());
    }
};
