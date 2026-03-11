// pages/ForgotPassword.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import useThemeStore from '../store/useThemeStore'
import './Auth.css'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ userId: '', petName: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()

  const handleChange = (e) => { setError(''); setForm({ ...form, [e.target.name]: e.target.value }) }

  const handleVerify = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { userId: form.userId, petName: form.petName })
      setStep(2)
    } catch (err) { setError(err.response?.data?.message || 'Verification failed') }
    finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { userId: form.userId, newPassword: form.newPassword, confirmPassword: form.confirmPassword })
      navigate('/login')
    } catch (err) { setError(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-root">
      <button className="auth-theme-btn" onClick={toggle}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔑</div>
          <span className="auth-logo-text">Recovery</span>
        </div>
        <h2 className="auth-title">{step === 1 ? 'Forgot password?' : 'Set new password'}</h2>
        <p className="auth-sub">{step === 1 ? 'Verify your identity first' : 'Almost there!'}</p>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-group">
              <label>User ID</label>
              <input name="userId" placeholder="Your UserID" value={form.userId} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>🔐 What is your pet's name?</label>
              <input name="petName" placeholder="Your answer" value={form.petName} onChange={handleChange} required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify Identity'}</button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <input name="newPassword" type="password" placeholder="New password" value={form.newPassword} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Resetting…' : 'Reset Password'}</button>
          </form>
        )}

        <div className="auth-links"><Link to="/login">← Back to login</Link></div>
      </div>
      <footer className="auth-footer">© All Rights Reserved | Built by Apurba Dutta</footer>
    </div>
  )
}
