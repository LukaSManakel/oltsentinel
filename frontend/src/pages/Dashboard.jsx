import { useState, useEffect } from 'react'

const API = ''

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

function gerarTextoPotencia(onu) {
  const dataHora = new Date().toLocaleString('pt-BR')
  return `📡 PROBLEMA DE POTÊNCIA ÓPTICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 OLT: ${onu.olt_name}
👤 Cliente/ONU: ${onu.name}

⚠️ Tipo: ${onu.power_status || 'SINAL FORA DO PADRÃO'}
📊 Potência medida: ${onu.power_dbm} dBm
✅ Faixa normal: -27 a -8 dBm

⚠️ Possíveis causas:
- Rompimento ou emenda ruim na fibra óptica
- Conector sujo ou com micro-trinca
- Atenuação excessiva no splitter
- Distância além do limite da planta

📌 Ações recomendadas:
- Inspecionar e limpar conectores ópticos
- Medir com OTDR para localizar ponto de falha
- Verificar emendas e caixas de atendimento
- Substituir trecho de fibra se necessário

📝 Observação:
Gerado automaticamente pelo sistema OLT Sentinel.
Data/Hora: ${dataHora}`
}

function copiarTexto(texto) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(texto)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = texto
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return Promise.resolve()
    } catch (err) {
      document.body.removeChild(textarea)
      return Promise.reject(err)
    }
  }
}

function BotaoCopiar({ onu }) {
  const [copiado, setCopiado] = useState(false)
  
  function copiar() {
    copiarTexto(gerarTextoOS(onu))
      .then(() => {
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
      })
      .catch(err => {
        console.error('Erro ao copiar:', err)
        alert('Erro ao copiar. Tente novamente.')
      })
  }

  return (
    <button 
      onClick={copiar} 
      style={{ 
        padding: '4px 10px', 
        background: copiado ? '#10b981' : '#6366f1', 
        color: '#fff',
        border: '1px solid ' + (copiado ? '#10b981' : '#6366f1'),
        borderRadius: 6, 
        fontSize: 11, 
        whiteSpace: 'nowrap',
        cursor: 'pointer'
      }}
    >
      {copiado ? '✅ Copiado!' : '📋 Copiar OS'}
    </button>
  )
}

function BotaoCopiarPotencia({ onu }) {
  const [copiado, setCopiado] = useState(false)
  
  function copiar() {
    copiarTexto(gerarTextoPotencia(onu))
      .then(() => {
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
      })
      .catch(err => {
        console.error('Erro ao copiar:', err)
        alert('Erro ao copiar. Tente novamente.')
      })
  }

  return (
    <button 
      onClick={copiar} 
      style={{ 
        padding: '4px 10px', 
        background: copiado ? '#10b981' : '#f59e0b', 
        color: '#fff',
        border: '1px solid ' + (copiado ? '#10b981' : '#f59e0b'),
        borderRadius: 6, 
        fontSize: 11, 
        whiteSpace: 'nowrap',
        cursor: 'pointer'
      }}
    >
      {copiado ? '✅ Copiado!' : '📋 Copiar Relatório'}
    </button>
  )
}

function CardStat({ label, valor, cor, icon }) {
  return (
    <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 20, borderLeft: `4px solid ${cor}` }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{icon} {valor}</div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [offline, setOffline] = useState([])
  const [powerIssues, setPowerIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroSev, setFiltroSev] = useState('todos')
  const [ordenacao, setOrdenacao] = useState('tempo_desc')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      const [s, o, p] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`).then(r => r.json()),
        fetch(`${API}/api/dashboard/offline`).then(r => r.json()),
        fetch(`${API}/api/dashboard/power-issues`).then(r => r.json()),
      ])
      setStats(s)
      setOffline(Array.isArray(o) ? o : [])
      setPowerIssues(Array.isArray(p) ? p : [])
    } finally { setLoading(false) }
  }

  const severityColor = { critico: '#ef4444', alerta: '#f59e0b', atencao: '#f97316', none: '#10b981' }
  const severityLabel = { critico: '🔴 Crítico', alerta: '🟡 Alerta', atencao: '🟠 Atenção', none: '🟢 Normal' }

  if (loading) return <div style={{ padding: 40, color: '#666' }}>Carregando...</div>

  let onusFiltradas = offline
  if (filtroSev !== 'todos') {
    onusFiltradas = onusFiltradas.filter(o => o.severity === filtroSev)
  }

  if (ordenacao === 'tempo_desc') {
    onusFiltradas = [...onusFiltradas].sort((a, b) => (b.offline_hours || 0) - (a.offline_hours || 0))
  } else if (ordenacao === 'tempo_asc') {
    onusFiltradas = [...onusFiltradas].sort((a, b) => (a.offline_hours || 0) - (b.offline_hours || 0))
  }

  const contadores = {
    critico: offline.filter(o => o.severity === 'critico').length,
    alerta: offline.filter(o => o.severity === 'alerta').length,
    atencao: offline.filter(o => o.severity === 'atencao').length,
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <CardStat label="Offline" valor={stats?.offline || 0} cor="#ef4444" icon="🔴" />
        <CardStat label="Críticos" valor={stats?.criticos || 0} cor="#ef4444" icon="🚨" />
        <CardStat label="Problemas Potência" valor={stats?.problemasPotencia || 0} cor="#f59e0b" icon="⚡" />
        <CardStat label="Online" valor={stats?.online || 0} cor="#10b981" icon="🟢" />
      </div>

      <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, color: '#fff', margin: 0 }}>🔴 ONUs Offline ({onusFiltradas.length})</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={filtroSev} 
              onChange={e => setFiltroSev(e.target.value)}
              style={{ padding: '6px 12px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 6, color: '#fff', fontSize: 13 }}
            >
              <option value="todos">Todos ({offline.length})</option>
              <option value="critico">🔴 Críticos ({contadores.critico})</option>
              <option value="alerta">🟡 Alertas ({contadores.alerta})</option>
              <option value="atencao">🟠 Atenção ({contadores.atencao})</option>
            </select>
            <select 
              value={ordenacao} 
              onChange={e => setOrdenacao(e.target.value)}
              style={{ padding: '6px 12px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 6, color: '#fff', fontSize: 13 }}
            >
              <option value="tempo_desc">⬇️ Mais tempo offline</option>
              <option value="tempo_asc">⬆️ Menos tempo offline</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {onusFiltradas.map(onu => (
            <div key={onu.id} style={{ background: '#0f1117', borderLeft: `4px solid ${severityColor[onu.severity] || '#666'}`, borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{onu.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                  📍 {onu.olt_name} • ⏱ Offline há {formatHoras(onu.offline_hours)} • {severityLabel[onu.severity] || '🟢 Normal'}
                </div>
                {onu.power_dbm && (
                  <div style={{ fontSize: 11, color: '#f59e0b' }}>⚡ Potência: {onu.power_dbm} dBm</div>
                )}
              </div>
              <BotaoCopiar onu={onu} />
            </div>
          ))}
        </div>
      </div>

      {powerIssues.length > 0 && (
        <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 24, marginTop: 24 }}>
          <h2 style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>⚡ Problemas de Potência ({powerIssues.length})</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {powerIssues.map(onu => (
              <div key={onu.id} style={{ background: '#0f1117', borderLeft: '4px solid #f59e0b', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{onu.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    📍 {onu.olt_name} • ⚡ {onu.power_dbm} dBm • {onu.power_status}
                  </div>
                </div>
                <BotaoCopiarPotencia onu={onu} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
