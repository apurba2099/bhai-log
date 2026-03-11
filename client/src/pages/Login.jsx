// pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ userId: "", password: "" });
  const { login, loading, error, clearError } = useAuthStore();
  const { connect } = useSocketStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.userId, form.password);
    if (ok) {
      connect(useAuthStore.getState().user._id);
      navigate("/");
    }
  };

  return (
    <div className="auth-root">
      <button className="auth-theme-btn" onClick={toggle} title="Toggle theme">
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-logo-text">&lt;BhaiLog/&gt;</span>
        </div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>User ID</label>
            <input
              name="userId"
              placeholder="Enter your UserID"
              value={form.userId}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>·</span>
          <Link to="/register">Create account</Link>
        </div>
      </div>
      <footer className="auth-footer">
        © All Rights Reserved | Built by Apurba Dutta
      </footer>
    </div>
  );
}
