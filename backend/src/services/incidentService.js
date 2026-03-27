function getSeverityByOfflineHours(hours) {
  if (hours >= 720) return 'critico';      // 30 dias ou mais
  if (hours >= 72) return 'alerta';        // 3 dias ou mais
  if (hours < 72) return 'normal';         // Menos de 3 dias
  return 'normal';
}

function getPowerStatus(dbm) {
  if (dbm === null || dbm === undefined) return 'undefined';
  if (dbm < -27) return 'critico_baixo';
  if (dbm > -8) return 'critico_alto';
  return 'normal';
}

function getPowerCause(dbm) {
  if (dbm === null || dbm === undefined || dbm === 0) return 'Causa indefinida, verificação em campo necessária';
  if (dbm < -27) return 'Possível fibra rompida ou alta atenuação no caminho óptico';
  if (dbm > -8) return 'Possível problema de balance no splitter';
  return 'Sinal dentro do intervalo aceitável';
}

function generateOSText({ oltName, onuName, offlineHours, powerDbm, severity }) {
  const days = Math.floor(offlineHours / 24);
  const hours = Math.floor(offlineHours % 24);
  const severityLabel = { critico: '🔴 CRÍTICO', alerta: '🟡 ALERTA', atencao: '🟠 ATENÇÃO', normal: '🟢 NORMAL' }[severity] || '⚪ INDEFINIDO';
  const powerString = (powerDbm !== null && powerDbm !== undefined) ? `${Number(powerDbm).toFixed(2)} dBm` : 'Sem leitura';
  
  return `🔧 ABERTURA DE OS - ATENDIMENTO TÉCNICO

📍 OLT: ${oltName}
👤 Cliente/ONU: ${onuName}

🚨 Status: OFFLINE
⏱ Tempo offline: ${days} dias e ${hours} horas
🔥 Severidade: ${severityLabel}

📡 Potência atual: ${powerString}

🧠 Análise automática:
${offlineHours >= 720 ? 'Cliente offline há período prolongado, indicando falha persistente.' : offlineHours >= 72 ? 'Cliente offline há mais de 3 dias, requer atenção urgente.' : 'Cliente offline há menos de 3 dias.'}

⚠️ Possível causa:
${getPowerCause(powerDbm)}

📌 Ação recomendada:
• Verificar sinal óptico
• Testar ONU
• Inspecionar cabeamento
• Validar porta na OLT

📝 Observação:
Gerado automaticamente pelo OLT Sentinel.`;
}

module.exports = { getSeverityByOfflineHours, getPowerStatus, getPowerCause, generateOSText };
