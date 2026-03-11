// pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    userId: "",
    password: "",
    confirmPassword: "",
    petName: "",
  });
  const { register, loading, error, clearError } = useAuthStore();
  const { connect } = useSocketStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await register(form);
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
        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Join the conversation today</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="fullName"
              placeholder="Your full name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>User ID</label>
            <input
              name="userId"
              placeholder="Choose a unique UserID"
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
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>🔐 Secret: What is your pet's name?</label>
            <input
              name="petName"
              placeholder="For password recovery"
              value={form.petName}
              onChange={handleChange}
              required
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        <div className="auth-links">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
      <footer className="auth-footer">
        © All Rights Reserved | Built by Apurba Dutta
      </footer>
    </div>
  );
}
