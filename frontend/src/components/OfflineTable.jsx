import CopyButton from './CopyButton';
const severityLabel = { critico:'🔴 Crítico', alto:'🟠 Alto', medio:'🟡 Médio', none:'⚪ Baixo' };
function formatOffline(hours) { const d=Math.floor(hours/24),h=Math.floor(hours%24); return d>0?`${d}d ${h}h`:`${h}h`; }
export default function OfflineTable({ data, loading }) {
  return (
    <div style={{ background:'#161b2e', borderRadius:12, border:'1px solid #2a3050', overflow:'hidden' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a3050', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:16, fontWeight:600 }}>📴 Clientes Offline</span>
        <span style={{ background:'#ff4d4d22', color:'#ff4d4d', borderRadius:99, padding:'2px 10px', fontSize:12 }}>{data?.length||0}</span>
      </div>
      {loading ? <div style={{ padding:40, textAlign:'center', color:'#555' }}>Carregando...</div> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#0f1117' }}>
              {['ONU / Cliente','OLT','Tempo Offline','Potência','Severidade','Ação'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#7788aa', fontWeight:500, borderBottom:'1px solid #2a3050' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(!data||data.length===0)&&<tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#445' }}>Nenhum cliente offline crítico</td></tr>}
              {data?.map((onu,i)=>(
                <tr key={onu.id} style={{ background:i%2===0?'#161b2e':'#131726', borderBottom:'1px solid #1e2540' }}>
                  <td style={{ padding:'12px 16px', fontWeight:500 }}>{onu.name}</td>
                  <td style={{ padding:'12px 16px', color:'#7aa2ff' }}>{onu.olt_name}</td>
                  <td style={{ padding:'12px 16px', color:'#ff9d1a', fontWeight:600 }}>{formatOffline(onu.offline_hours)}</td>
                  <td style={{ padding:'12px 16px', color:onu.power_dbm?'#e0e0e0':'#445' }}>{onu.power_dbm?`${Number(onu.power_dbm).toFixed(2)} dBm`:'—'}</td>
                  <td style={{ padding:'12px 16px' }}><span className={`badge-${onu.severity}`} style={{ borderRadius:99, padding:'3px 10px', fontSize:12, fontWeight:600 }}>{severityLabel[onu.severity]||onu.severity}</span></td>
                  <td style={{ padding:'12px 16px' }}><CopyButton text={onu.osText}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
