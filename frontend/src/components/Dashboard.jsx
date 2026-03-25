import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Radio } from 'lucide-react';
import StatsCards from './StatsCards';
import OfflineTable from './OfflineTable';
import PowerTable from './PowerTable';
import RankingOLTs from './RankingOLTs';
import { getStats, getOffline, getPowerIssues, getRankingOLTs } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [offline, setOffline] = useState([]);
  const [power, setPower] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('offline');
  const [filterSeverity, setFilterSeverity] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s,o,p,r] = await Promise.all([getStats(), getOffline({ severity:filterSeverity||undefined }), getPowerIssues(), getRankingOLTs()]);
      setStats(s); setOffline(o); setPower(p); setRanking(r);
      setLastUpdate(new Date());
    } catch(err) { console.error('Erro:', err.message); }
    finally { setLoading(false); }
  }, [filterSeverity]);

  useEffect(() => { fetchAll(); const t=setInterval(fetchAll,30000); return ()=>clearInterval(t); }, [fetchAll]);

  const tab = (active) => ({ padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer', fontSize:14, fontWeight:500, background:active?'#1e2d6b':'transparent', color:active?'#7aa2ff':'#6677aa' });

  return (
    <div style={{ maxWidth:1400, margin:'0 auto', padding:'24px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ background:'#1e2d6b', padding:10, borderRadius:10 }}><Radio size={24} color="#7aa2ff"/></div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:'#e0eaff' }}>OLT Sentinel</h1>
            <p style={{ fontSize:12, color:'#5566aa' }}>Monitoramento inteligente de rede óptica</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {lastUpdate&&<span style={{ fontSize:12, color:'#445577' }}>Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}</span>}
          <button onClick={fetchAll} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #2a3050', background:'#161b2e', color:'#7aa2ff', cursor:'pointer', fontSize:13 }}>
            <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>Atualizar
          </button>
        </div>
      </div>
      <StatsCards stats={stats}/>
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'#0f1117', padding:4, borderRadius:10, width:'fit-content' }}>
        <button style={tab(activeTab==='offline')} onClick={()=>setActiveTab('offline')}>📴 Offline</button>
        <button style={tab(activeTab==='power')} onClick={()=>setActiveTab('power')}>📡 Potência</button>
        <button style={tab(activeTab==='ranking')} onClick={()=>setActiveTab('ranking')}>🏆 Ranking OLTs</button>
      </div>
      {activeTab==='offline'&&(
        <div style={{ marginBottom:16, display:'flex', gap:8 }}>
          {['','critico','alto','medio'].map(s=>(
            <button key={s} onClick={()=>setFilterSeverity(s)} style={{ padding:'5px 14px', borderRadius:99, border:'none', cursor:'pointer', fontSize:13, background:filterSeverity===s?'#1e2d6b':'#1a1d27', color:filterSeverity===s?'#7aa2ff':'#6677aa' }}>
              {s===''?'Todos':s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      )}
      {activeTab==='offline'&&<OfflineTable data={offline} loading={loading}/>}
      {activeTab==='power'&&<PowerTable data={power} loading={loading}/>}
      {activeTab==='ranking'&&<RankingOLTs data={ranking}/>}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
