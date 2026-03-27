import { useState, useEffect } from 'react'

const API = ''

function authHeaders() {
  const token = localStorage.getItem('olt_token')
  return { Authorization: `Bearer ${token}` }
}

function formatHoras(h) {
  if (!h) return 'N/A'
  const dias = Math.floor(h / 24)
  const horas = Math.floor(h % 24)
  if (dias > 0) return `${dias}d ${horas}h`
  return `${horas}h`
}

function gerarTextoOS(onu) {
  const severidadeEmoji = onu.severity === 'critico' ? '🔴 CRÍTICO' : onu.severity === 'alerta' ? '🟡 ALERTA' : '🟠 ATENÇÃO'
  const potencia = onu.power_dbm ? `${onu.power_dbm} dBm` : 'Sem leitura'
  const tempo = formatHoras(onu.offline_hours)
  let analise = 'Cliente offline recentemente.'
  if (onu.offline_hours > 720) analise = 'Cliente offline há período prolongado, indicando falha persistente.'
  else if (onu.offline_hours > 24) analise = 'Cliente offline há mais de 24h, requer atenção técnica.'

  return `🔧 ABERTURA DE OS - ATENDIMENTO TÉCNICO

📍 OLT: ${onu.olt_name}
👤 Cliente/ONU: ${onu.name}

🚨 Status: OFFLINE
⏱ Tempo offline: ${tempo}
🔥 Severidade: ${severidadeEmoji}

📡 Potência atual: ${potencia}

🧠 Análise automática:
${analise}

⚠️ Possível causa:
Causa indefinida, necessário verificação em campo

📌 Ação recomendada:
• Verificar sinal óptico
• Testar ONU
• Inspecionar cabeamento
• Validar porta na OLT

📝 Observação:
Gerado automaticamente pelo OLT Sentinel.`
}

function CardStat({ label, valor, cor, icon }) {
  return (
    <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 20, borderLeft: `4px solid ${cor}` }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase' }}>{icon} {label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{valor}</div>
    </div>
  )
}

function BotaoCopiar({ onu }) {
  const [copiado, setCopiado] = useState(false)
  function copiar() {
    navigator.clipboard.writeText(gerarTextoOS(onu))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <button onClick={copiar} style={{ padding: '4px 10px', background: copiado ? '#10b98120' : '#6366f120', border: `1px solid ${copiado ? '#10b981' : '#6366f1'}`, borderRadius: 6, color: copiado ? '#10b981' : '#6366f1', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>
      {copiado ? '✅ Copiado!' : '📋 Copiar OS'}
    </button>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [offline, setOffline] = useState([])
  const [powerIssues, setPowerIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      const [s, o, p] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/dashboard/offline`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/dashboard/power-issues`, { headers: authHeaders() }).then(r => r.json()),
      ])
      setStats(s)
      setOffline(Array.isArray(o) ? o : [])
      setPowerIssues(Array.isArray(p) ? p : [])
    } finally { setLoading(false) }
  }

  const severityColor = { critico: '#ef4444', alerta: '#f59e0b', atencao: '#f97316', none: '#10b981' }
  const severityLabel = { critico: '🔴 Crítico', alerta: '🟡 Alerta', atencao: '🟠 Atenção', none: '🟢 Normal' }

  if (loading) return <div style={{ padding: 40, color: '#666' }}>Carregando...</div>

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>📊 Dashboard</h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>Monitoramento em tempo real das ONUs</p>
        </div>
        <button onClick={carregar} style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>🔄 Atualizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <CardStat label="Offline" valor={stats?.offline || 0} cor="#ef4444" icon="🔴" />
        <CardStat label="Críticos" valor={stats?.criticos || 0} cor="#f59e0b" icon="🔥" />
        <CardStat label="Prob. Potência" valor={stats?.problemasPotencia || 0} cor="#f97316" icon="📡" />
        <CardStat label="Online" valor={stats?.online || 0} cor="#10b981" icon="🟢" />
      </div>

      <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>🔴 ONUs Offline ({offline.length})</h2>
        {offline.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>Nenhuma ONU offline</div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
                {['Cliente/ONU', 'OLT', 'Tempo Offline', 'Severidade', 'Potência', 'Ação'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#666', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offline.map(onu => (
                <tr key={onu.id} style={{ borderBottom: '1px solid #2a2d3e1a' }}>
                  <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 500 }}>{onu.name}</td>
                  <td style={{ padding: '10px 12px', color: '#aaa' }}>{onu.olt_name}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b' }}>{formatHoras(onu.offline_hours)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: severityColor[onu.severity] || '#aaa' }}>{severityLabel[onu.severity] || onu.severity}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#aaa' }}>{onu.power_dbm ? `${onu.power_dbm} dBm` : 'N/A'}</td>
                  <td style={{ padding: '10px 12px' }}><BotaoCopiar onu={onu} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>📡 Problemas de Potência ({powerIssues.length})</h2>
        {powerIssues.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>Nenhum problema de potência</div>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
                {['Cliente/ONU', 'OLT', 'Potência (dBm)', 'Status', 'Ação'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#666', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {powerIssues.map(onu => (
                <tr key={onu.id} style={{ borderBottom: '1px solid #2a2d3e1a' }}>
                  <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 500 }}>{onu.name}</td>
                  <td style={{ padding: '10px 12px', color: '#aaa' }}>{onu.olt_name}</td>
                  <td style={{ padding: '10px 12px', color: '#f97316' }}>{onu.power_dbm} dBm</td>
                  <td style={{ padding: '10px 12px', color: '#f97316' }}>{onu.power_status}</td>
                  <td style={{ padding: '10px 12px' }}><BotaoCopiar onu={onu} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
