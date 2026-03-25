const lbl = { critico_baixo:'🔴 Baixo (<-27dBm)', critico_alto:'🟠 Alto (>-8dBm)', normal:'🟢 Normal', indefinido:'⚪ S/Leitura' };
export default function PowerTable({ data, loading }) {
  return (
    <div style={{ background:'#161b2e', borderRadius:12, border:'1px solid #2a3050', overflow:'hidden' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a3050', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:16, fontWeight:600 }}>📡 Problemas de Potência Óptica</span>
        <span style={{ background:'#ffd70022', color:'#ffd700', borderRadius:99, padding:'2px 10px', fontSize:12 }}>{data?.length||0}</span>
      </div>
      {loading ? <div style={{ padding:40, textAlign:'center', color:'#555' }}>Carregando...</div> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#0f1117' }}>
              {['ONU / Cliente','OLT','Potência (dBm)','Status','Link'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#7788aa', fontWeight:500, borderBottom:'1px solid #2a3050' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(!data||data.length===0)&&<tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#445' }}>Nenhum problema de potência</td></tr>}
              {data?.map((onu,i)=>(
                <tr key={onu.id} style={{ background:i%2===0?'#161b2e':'#131726', borderBottom:'1px solid #1e2540' }}>
                  <td style={{ padding:'12px 16px', fontWeight:500 }}>{onu.name}</td>
                  <td style={{ padding:'12px 16px', color:'#7aa2ff' }}>{onu.olt_name}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:onu.power_dbm<-27?'#ff4d4d':'#ff9d1a' }}>{onu.power_dbm?Number(onu.power_dbm).toFixed(2):'—'}</td>
                  <td style={{ padding:'12px 16px' }}><span className={`badge-${onu.power_status}`} style={{ borderRadius:99, padding:'3px 10px', fontSize:12, fontWeight:600 }}>{lbl[onu.power_status]}</span></td>
                  <td style={{ padding:'12px 16px', color:onu.status==='offline'?'#ff4d4d':'#66bb6a' }}>{onu.status==='offline'?'🔴 Offline':'🟢 Online'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
