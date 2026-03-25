import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button onClick={handleCopy} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, background:copied?'#1a7a3a':'#1e2d6b', color:copied?'#66ee88':'#7aa2ff' }}>
      {copied ? <Check size={14}/> : <Copy size={14}/>}
      {copied ? 'Copiado!' : 'Copiar OS'}
    </button>
  );
}
