import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth.api';
import { initializeSession } from '../../utils/sessionManager';
import './Authentication.css';

const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            console.log("🚀 Attempting login with:", formData.email);
            const response = await loginUser(formData);
            console.log("📥 Raw Login Response:", response);

            // Extract from various possible backend structures
            let token = response.data?.token || response.token || response.access_token || (typeof response.data === 'string' ? response.data : null);
            let user = response.data?.user || response.user || (typeof response.data === 'object' ? response.data : null);

            // 🌩️ If token is still an object, dig deeper
            if (token && typeof token === 'object') {
                token = token.token || token.access_token || token.key || token.id_token;
            }

            if (!token || typeof token !== 'string') {
                console.error("❌ Invalid token format received:", token);
                throw new Error("Login failed: Invalid token format received from server.");
            }

            console.log("✅ Token received, saving to localStorage...");
            // Initialize session with token, user data, and login timestamp
            initializeSession(token, user || {});

            // Force visual confirmation
            const userData = user?.name || user?.email || user?.username || "Authenticated User";
            setError(`Success! Logged in as: ${userData}`);

            setTimeout(() => {
                navigate('/');
            }, 800);
        } catch (err: any) {
            console.error("❌ Login Error:", err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Please enter your details to sign in</p>
                    {error && <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter Email Address..."
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter Password..."
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?
                        <Link to="/register" className="auth-link">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
