import { useState, useEffect } from 'react'
const API = ''

function authHeaders() {
  const token = localStorage.getItem('olt_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

const lStyle = { fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }
const iStyle = { width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 6, color: '#fff', fontSize: 13, boxSizing: 'border-box' }

function Card({ cor, icon, label, valor, small }) {
  return (
    <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 20, borderLeft: `4px solid ${cor}` }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase' }}>{icon} {label}</div>
      <div style={{ fontSize: small ? 13 : 28, fontWeight: 700, color: '#fff' }}>{valor}</div>
    </div>
  )
}

function DashboardDia({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [novaTask, setNovaTask] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch(`${API}/api/hub/dashboard`, { headers: authHeaders() })
      const json = await res.json()
      if (!res.ok || json.error) { setErro(json.error || 'Erro ao carregar'); return }
      setData(json)
    } catch (e) { setErro('Erro de conexão') }
    finally { setLoading(false) }
  }

  async function concluir(id) {
    await fetch(`${API}/api/hub/tasks/${id}/concluir`, { method: 'POST', headers: authHeaders() })
    carregar()
  }

  async function adicionarTask(e) {
    e.preventDefault()
    if (!novaTask.trim()) return
    await fetch(`${API}/api/hub/tasks`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ titulo: novaTask, tipo: 'manual', data: new Date().toISOString().split('T')[0] }) })
    setNovaTask('')
    carregar()
  }

  if (loading) return <div>Carregando...</div>
  if (erro) return <div>Erro: {erro}</div>
  if (!data) return null

  return (
    <div>
      <h3 style={{ color: '#fff', marginBottom: 16 }}>📌 Tarefas do Dia</h3>
      {(!data.tasks || data.tasks.length === 0) && <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>Nenhuma tarefa para hoje</div>}
      {(data.tasks || []).map(task => (
        <div key={task.id} style={{ background: '#1a1d2e', borderRadius: 12, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 500 }}>{task.titulo}</div>
            {task.status === 'concluido' && (
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>
                ✅ {task.concluido_por_nome} às {new Date(task.concluido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          {task.status === 'pendente' && (
            <button onClick={() => concluir(task.id)} style={{ padding: '6px 14px', background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Concluir</button>
          )}
        </div>
      ))}
      {user.role === 'admin' && (
        <form onSubmit={adicionarTask} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input value={novaTask} onChange={e => setNovaTask(e.target.value)} placeholder="Adicionar tarefa manual..." style={{ flex: 1, padding: '8px 12px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          <button type="submit" style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>+ Adicionar</button>
        </form>
      )}
    </div>
  )
}

function Calendario({ user }) {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', participantes: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      const res = await fetch(`${API}/api/hub/events`, { headers: authHeaders() })
      const json = await res.json()
      setEvents(Array.isArray(json) ? json : [])
    } catch (e) { setEvents([]) }
  }

  async function criarEvento(e) {
    e.preventDefault()
    setErro('')
    try {
      const res = await fetch(`${API}/api/hub/events`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...form, participantes: form.participantes.split(',').map(p => p.trim()).filter(Boolean) }) })
      const json = await res.json()
      if (!res.ok) { setErro(json.error || 'Erro ao criar'); return }
      setForm({ titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', participantes: '' })
      setMostrarForm(false)
      carregar()
    } catch (e) { setErro('Erro de conexão') }
  }

  async function deletar(id) {
    await fetch(`${API}/api/hub/events/${id}`, { method: 'DELETE', headers: authHeaders() })
    carregar()
  }

  const tipoColors = { reuniao: '#6366f1', treinamento: '#f59e0b', visita: '#10b981' }
  const tipoLabels = { reuniao: '🤝 Reunião', treinamento: '📚 Treinamento', visita: '🔧 Visita Técnica' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: '#fff', margin: 0 }}>🗓️ Eventos</h3>
        {user.role === 'admin' && <button onClick={() => setMostrarForm(!mostrarForm)} style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>+ Novo Evento</button>}
      </div>

      {erro && <div style={{ background: '#ff444420', color: '#ff4444', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{erro}</div>}

      {mostrarForm && (
        <form onSubmit={criarEvento} style={{ background: '#1a1d2e', padding: 20, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lStyle}>Título</label><input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required style={iStyle} /></div>
            <div><label style={lStyle}>Tipo</label><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={iStyle}><option value="reuniao">Reunião</option><option value="treinamento">Treinamento</option><option value="visita">Visita Técnica</option></select></div>
            <div style={{ gridColumn: 'span 2' }}><label style={lStyle}>Participantes (vírgula)</label><input value={form.participantes} onChange={e => setForm({ ...form, participantes: e.target.value })} style={iStyle} placeholder="Daniel, Lucas..." /></div>
            <div><label style={lStyle}>Início</label><input type="datetime-local" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} required style={iStyle} /></div>
            <div><label style={lStyle}>Fim</label><input type="datetime-local" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} style={iStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={lStyle}>Descrição</label><textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} style={{ ...iStyle, height: 80, resize: 'vertical' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" style={{ padding: '8px 20px', background: '#6366f1', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>Salvar</button>
            <button type="button" onClick={() => setMostrarForm(false)} style={{ padding: '8px 20px', background: '#374151', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {events.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Nenhum evento cadastrado</div>}
        {events.map(ev => (
          <div key={ev.id} style={{ background: '#1a1d2e', borderRadius: 12, padding: 16, borderLeft: `4px solid ${tipoColors[ev.tipo] || '#6366f1'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>{ev.titulo}</div>
                <div style={{ fontSize: 12, color: tipoColors[ev.tipo], marginTop: 2 }}>{tipoLabels[ev.tipo]}</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>📅 {new Date(ev.data_inicio).toLocaleString('pt-BR')}{ev.data_fim ? ` → ${new Date(ev.data_fim).toLocaleString('pt-BR')}` : ''}</div>
                {ev.participantes?.length > 0 && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>👥 {Array.isArray(ev.participantes) ? ev.participantes.join(', ') : ev.participantes}</div>}
                {ev.descricao && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{ev.descricao}</div>}
              </div>
              {user.role === 'admin' && <button onClick={() => deletar(ev.id)} style={{ background: '#ff444420', border: '1px solid #ff4444', borderRadius: 6, color: '#ff4444', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Excluir</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Historico() {
  const [items, setItems] = useState([])
  useEffect(() => {
    fetch(`${API}/api/hub/historico`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
  }, [])

  return (
    <div>
      <h3 style={{ color: '#fff', marginBottom: 16 }}>📋 Histórico de Tarefas Concluídas</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Nenhuma tarefa concluída ainda</div>}
        {items.map(t => (
          <div key={t.id} style={{ background: '#1a1d2e', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <div style={{ color: '#fff' }}>{t.titulo}</div>
            <div style={{ color: '#666' }}>✅ {t.concluido_por_nome} - {new Date(t.concluido_em).toLocaleDateString('pt-BR')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Hub() {
  const [user, setUser] = useState(null)
  const [aba, setAba] = useState('dia')

  useEffect(() => {
    const u = localStorage.getItem('olt_user')
    if (u) setUser(JSON.parse(u))
  }, [])

  if (!user) return null

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', borderRadius: 16, padding: '24px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24 }}>Olá, {user.nome}! 👋</h2>
          <p style={{ margin: '4px 0 0', color: '#e0e7ff', opacity: 0.9 }}>Bem-vindo ao Sentinel Hub</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 12, color: '#fff', fontSize: 13, border: '1px solid rgba(255,255,255,0.2)' }}>
          📍 {user.role === 'admin' ? 'Administrador' : 'Técnico'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setAba('dia')} style={{ padding: '10px 20px', background: aba === 'dia' ? '#6366f1' : '#1a1d2e', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>☀️ Dia</button>
        <button onClick={() => setAba('calendario')} style={{ padding: '10px 20px', background: aba === 'calendario' ? '#6366f1' : '#1a1d2e', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>🗓️ Calendário</button>
        <button onClick={() => setAba('historico')} style={{ padding: '10px 20px', background: aba === 'historico' ? '#6366f1' : '#1a1d2e', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>📋 Histórico</button>
      </div>

      <div style={{ background: '#0f1117', borderRadius: 16, padding: 24, border: '1px solid #2a2d3e' }}>
        {aba === 'dia' && <DashboardDia user={user} />}
        {aba === 'calendario' && <Calendario user={user} />}
        {aba === 'historico' && <Historico />}
      </div>
    </div>
  )
}
