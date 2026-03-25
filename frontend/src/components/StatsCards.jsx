import { WifiOff, AlertTriangle, Signal, Wifi } from 'lucide-react';
export default function StatsCards({ stats }) {
  if (!stats) return null;
  const cards = [
    { label: 'Total Offline', value: stats.offline, icon: <WifiOff size={22}/>, color: '#ff4d4d' },
    { label: 'Críticos', value: stats.criticos, icon: <AlertTriangle size={22}/>, color: '#ff9d1a' },
    { label: 'Prob. Potência', value: stats.problemasPotencia, icon: <Signal size={22}/>, color: '#ffd700' },
    { label: 'Online', value: stats.online, icon: <Wifi size={22}/>, color: '#66bb6a' },
  ];
  return (
    <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background:'#161b2e', border:`1px solid ${c.color}33`, borderRadius:12, padding:'20px 24px', flex:1, minWidth:180 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ color:'#8899bb', fontSize:13 }}>{c.label}</span>
            <span style={{ color:c.color }}>{c.icon}</span>
          </div>
          <div style={{ fontSize:34, fontWeight:700, color:c.color }}>{c.value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}
