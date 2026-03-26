import { useState } from 'react'
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer login')
      onLogin(data.user, data.token)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }
  const inp = { width: '100%', padding: '10px 14px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 8, color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }
  const lbl = { fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 380, background: '#1a1d2e', borderRadius: 16, padding: 40, boxShadow: '0 20px 60px #0008' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>OLT Sentinel</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Acesso restrito à equipe técnica</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <span style={lbl}>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" style={inp} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <span style={lbl}>Senha</span>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••" style={inp} />
          </div>
          {erro && <div style={{ background: '#ff444420', border: '1px solid #ff4444', borderRadius: 8, padding: '10px 14px', color: '#ff6666', fontSize: 13, marginBottom: 16 }}>{erro}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#4f46e5aa' : '#6366f1', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
