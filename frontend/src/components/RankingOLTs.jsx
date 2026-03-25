export default function RankingOLTs({ data }) {
  if (!data||data.length===0) return null;
  const max = Math.max(...data.map(d=>parseInt(d.offline_count)||0),1);
  return (
    <div style={{ background:'#161b2e', borderRadius:12, border:'1px solid #2a3050', padding:20 }}>
      <div style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>🏆 Ranking — OLTs com Mais Problemas</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {data.slice(0,10).map((olt,i)=>{
          const pct=((parseInt(olt.offline_count)||0)/max)*100;
          return (
            <div key={olt.olt_name}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                <span style={{ color:'#b0c0e0' }}>{i+1}. {olt.olt_name||'Desconhecida'}</span>
                <span style={{ color:'#ff9d1a' }}>{olt.offline_count} offline · {olt.critico_count} críticos</span>
              </div>
              <div style={{ height:6, borderRadius:3, background:'#0f1117', overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg,#ff4d4d,#ff9d1a)', borderRadius:3 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
