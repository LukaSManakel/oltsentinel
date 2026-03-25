function getSeverityByOfflineHours(hours) {
  if (hours >= 240) return 'critico';
  if (hours >= 120) return 'alto';
  if (hours >= 72)  return 'medio';
  return 'none';
}

function getPowerStatus(dbm) {
  if (dbm === null || dbm === undefined) return 'indefinido';
  if (dbm < -27) return 'critico_baixo';
  if (dbm > -8)  return 'critico_alto';
  return 'normal';
}

function getPowerCause(dbm) {
  if (dbm === null || dbm === undefined || dbm === 0) return 'Causa indefinida, necessário verificação em campo';
  if (dbm < -27) return 'Possível rompimento ou atenuação elevada na fibra óptica';
  if (dbm > -8)  return 'Possível problema de sinal alto ou desbalanceamento no splitter';
  return 'Sinal dentro da faixa aceitável';
}

function generateOSText({ oltName, onuName, offlineHours, powerDbm, severity }) {
  const days = Math.floor(offlineHours / 24);
  const hours = Math.floor(offlineHours % 24);
  const severityLabel = { critico: '🔴 CRÍTICO', alto: '🟠 ALTO', medio: '🟡 MÉDIO', none: '⚪ BAIXO' }[severity] || '⚪ INDEFINIDO';
  const powerStr = (powerDbm !== null && powerDbm !== undefined) ? `${Number(powerDbm).toFixed(2)} dBm` : 'Sem leitura';
  return `🔧 ABERTURA DE OS - ATENDIMENTO TÉCNICO\n\n📍 OLT: ${oltName}\n👤 Cliente/ONU: ${onuName}\n\n🚨 Status: OFFLINE\n⏱ Tempo offline: ${days} dias e ${hours} horas\n🔥 Severidade: ${severityLabel}\n\n📡 Potência atual: ${powerStr}\n\n🧠 Análise automática:\nCliente offline há período prolongado, indicando falha persistente.\n\n⚠️ Possível causa:\n${getPowerCause(powerDbm)}\n\n📌 Ação recomendada:\n• Verificar sinal óptico\n• Testar ONU\n• Inspecionar cabeamento\n• Validar porta na OLT\n\n📝 Observação:\nGerado automaticamente pelo OLT Sentinel.`;
}

module.exports = { getSeverityByOfflineHours, getPowerStatus, getPowerCause, generateOSText };
