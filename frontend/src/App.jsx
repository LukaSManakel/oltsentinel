import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hub from './pages/Hub'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    const saved = localStorage.getItem('olt_user')
    const token = localStorage.getItem('olt_token')
    if (saved && token) setUser(JSON.parse(saved))
  }, [])

  function handleLogin(userData, token) {
    localStorage.setItem('olt_user', JSON.stringify(userData))
    localStorage.setItem('olt_token', token)
    setUser(userData)
  }

  function handleLogout() {
    localStorage.removeItem('olt_user')
    localStorage.removeItem('olt_token')
    setUser(null)
    setPage('dashboard')
  }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#1a1d2e', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2a2d3e' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>⚡ OLT Sentinel</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>v2.0</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          <NavItem icon="📊" label="Dashboard" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon="🏢" label="Hub Operacional" active={page === 'hub'} onClick={() => setPage('hub')} />
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2d3e' }}>
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>
            👤 {user.nome}
            <span style={{ marginLeft: 6, fontSize: 10, background: user.role === 'admin' ? '#6366f1' : '#374151', padding: '2px 6px', borderRadius: 4 }}>
              {user.role}
            </span>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: '#374151', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {page === 'dashboard' && <Dashboard user={user} />}
        {page === 'hub' && <Hub user={user} />}
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
      background: active ? '#6366f120' : 'transparent',
      borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
      color: active ? '#6366f1' : '#aaa', fontSize: 14, transition: 'all 0.2s'
    }}>
      {icon} {label}
    </div>
  )
}
