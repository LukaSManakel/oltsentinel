import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function authHeaders() {
  const token = localStorage.getItem('olt_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

const labelStyle = { fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 6, color: '#fff', fontSize: 13, boxSizing: 'border-box' }

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

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/hub/dashboard`, { headers: authHeaders() })
      setData(await res.json())
    } finally { setLoading(false) }
  }

  async function concluir(id) {
    await fetch(`${API}/api/hub/tasks/${id}/concluir`, { method: 'POST', headers: authHeaders() })
    carregar()
  }

  async function adicionarTask(e) {
    e.preventDefault()
    if (!novaTask.trim()) return
    await fetch(`${API}/api/hub/tasks`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ titulo: novaTask, tipo: 'manual', data: new Date().toISOString().split('T')[0] })
    })
    setNovaTask('')
    carregar()
  }

  if (loading) return <div style={{ color: '#666', padding: 40 }}>Carregando...</div>
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card cor="#6366f1" icon="📅" label="Hoje" valor={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} small />
        <Card cor="#10b981" icon="👤" label="Responsável do Dia" valor={data.responsavel} />
        <Card cor="#f59e0b" icon="⏳" label="Pendentes" valor={data.stats?.pendentes || 0} />
        <Card cor="#6366f1" icon="✅" label="Concluídas" valor={data.stats?.concluidos || 0} />
      </div>
      <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#fff' }}>📌 Tarefas do Dia</h3>
        {data.tasks?.map(task => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0f1117', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${task.status === 'concluido' ? '#10b981' : '#f59e0b'}` }}>
            <div>
              <div style={{ fontSize: 14, color: task.status === 'concluido' ? '#666' : '#fff', textDecoration: task.status === 'concluido' ? 'line-through' : 'none' }}>{task.titulo}</div>
              {task.status === 'concluido' && (
                <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>✅ {task.concluido_por_nome} às {new Date(task.concluido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
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
    </div>
  )
}

function Calendario({ user }) {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', participantes: '' })
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const res = await fetch(`${API}/api/hub/events`, { headers: authHeaders() })
    setEvents(await res.json())
  }

  async function criarEvento(e) {
    e.preventDefault()
    await fetch(`${API}/api/hub/events`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ...form, participantes: form.participantes.split(',').map(p => p.trim()).filter(Boolean) })
    })
    setForm({ titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', participantes: '' })
    setMostrarForm(false)
    carregar()
  }

  async function deletar(id) {
    await fetch(`${API}/api/hub/events/${id}`, { method: 'DELETE', headers: authHeaders() })
    carregar()
  }

  const tipoColors = { reuniao: '#6366f1', treinamento: '#f59e0b', visita: '#10b981' }
  const tipoLabels = { reuniao: '🤝 Reunião', treinamento: '📚 Treinamento', visita: '🔧 Visita Técnica' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#fff' }}>🗓️ Eventos</h3>
        {user.role === 'admin' && (
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>+ Novo Evento</button>
        )}
      </div>
      {mostrarForm && (
        <form onSubmit={criarEvento} style={{ background: '#1a1d2e', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              abel style={labelStyle}>Título</label>
              <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              abel style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                <option value="reuniao">Reunião de Alinhamento</option>
                <option value="treinamento">Treinamento com Parceiros</option>
                <option value="visita">Visita Técnica</option>
              </select>
            </div>
            <div>
              abel style={labelStyle}>Participantes (vírgula)</label>
              <input value={form.participantes} onChange={e => setForm({ ...form, participantes: e.target.value })} style={inputStyle} placeholder="Daniel, Lucas..." />
            </div>
            <div>
              abel style={labelStyle}>Início</label>
              <input type="datetime-local" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              abel style={labelStyle}>Fim</label>
              <input type="datetime-local" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              abel style={labelStyle}>Descrição</label>
              <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
            </div>
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
                {ev.participantes?.length > 0 && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>👥 {ev.participantes.join(', ')}</div>}
                {ev.descricao && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{ev.descricao}</div>}
              </div>
              {user.role === 'admin' && (
                <button onClick={() => deletar(ev.id)} style={{ background: '#ff444420', border: '1px solid #ff4444', borderRadius: 6, color: '#ff4444', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              )}
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
      .then(r => r.json()).then(setItems)
  }, [])
  return (
    <div>
      <h3 style={{ color: '#fff', marginBottom: 16 }}>📋 Histórico de Tarefas Concluídas</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Nenhuma tarefa concluída ainda</div>}
        {items.map(t => (
          <div key={t.id} style={{ background: '#1a1d2e', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 14 }}>{t.titulo}</div>
              <div style={{ color: '#10b981', fontSize: 12, marginTop: 2 }}>✅ {t.concluido_por_nome} — {new Date(t.concluido_em).toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>{new Date(t.data).toLocaleDateString('pt-BR')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Ranking() {
  const [items, setItems] = useState([])
  useEffect(() =>
