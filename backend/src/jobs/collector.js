const { Pool } = require('pg');
const zabbix = require('../services/zabbixService');
const { getSeverityByOfflineHours, getPowerStatus } = require('../services/incidentService');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function isOLT(host) {
  const name = (host.name || host.host || '').toLowerCase();
  return name.includes('olt') || name.includes('bdcom') || name.includes('huawei ma') || name.includes('fiberhome');
}

async function collectData() {
  console.log(`[Collector] Iniciando: ${new Date().toISOString()}`);
  const client = await pool.connect();
  try {
    const allHosts = await zabbix.getHostsWithAvailability();
    const oltHosts = allHosts.filter(h => isOLT(h));
    const onuHosts = allHosts.filter(h => !isOLT(h));
    console.log(`[Collector] OLTs: ${oltHosts.length} | ONUs: ${onuHosts.length}`);

    for (const olt of oltHosts) {
      const ip = olt.interfaces?.[0]?.ip || '';
      await client.query(
        `INSERT INTO olts (name, host_id, ip, updated_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (name) DO UPDATE SET host_id=$2, ip=$3, updated_at=NOW()`,
        [olt.name || olt.host, olt.hostid, ip]
      );
    }

    const allHostIds = allHosts.map(h => h.hostid);
    let powerMap = {};
    try {
      const items = await zabbix.getPowerItems(allHostIds.slice(0, 500));
      for (const item of items) {
        const val = parseFloat(item.lastvalue);
        if (!isNaN(val) && val !== 0) powerMap[item.hostid] = val;
      }
    } catch (e) { console.warn('[Collector] Erro potência:', e.message); }

    let offlineMap = {};
    try {
      const triggers = await zabbix.getHostAvailabilityEvents(allHostIds.slice(0, 500));
      for (const trigger of triggers) {
        if (trigger.hosts && trigger.value === '1') {
          for (const h of trigger.hosts) {
            const sec = parseInt(trigger.lastchange);
            offlineMap[h.hostid] = { since: new Date(sec * 1000), hours: (Date.now() - sec * 1000) / 3600000 };
          }
        }
      }
    } catch (e) { console.warn('[Collector] Erro triggers:', e.message); }

    for (const host of onuHosts) {
      let oltName = 'Desconhecida';
      if (host.groups) {
        const g = host.groups.find(g => isOLT({ name: g.name }));
        if (g) oltName = g.name;
      }
      const isOffline = host.available === '2' || host.snmp_available === '2';
      const status = isOffline ? 'offline' : 'online';
      const offlineInfo = offlineMap[host.hostid];
      const offlineHours = offlineInfo ? offlineInfo.hours : 0;
      const offlineSince = offlineInfo ? offlineInfo.since : null;
      const severity = isOffline ? getSeverityByOfflineHours(offlineHours) : 'none';
      const powerDbm = powerMap[host.hostid] || null;
      const powerStatus = getPowerStatus(powerDbm);
      const hostName = host.name || host.host;

      await client.query(
        `INSERT INTO onus (name, olt_name, status, offline_since, offline_hours, power_dbm, power_status, severity, last_seen, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) ON CONFLICT DO NOTHING`,
        [hostName, oltName, status, offlineSince, offlineHours, powerDbm, powerStatus, severity]
      );
      await client.query(
        `UPDATE onus SET olt_name=$2, status=$3, offline_since=$4, offline_hours=$5, power_dbm=$6, power_status=$7, severity=$8, last_seen=NOW(), updated_at=NOW() WHERE name=$1`,
        [hostName, oltName, status, offlineSince, offlineHours, powerDbm, powerStatus, severity]
      );

      if (severity === 'critico' && isOffline) {
        const ex = await client.query(`SELECT id FROM incidents WHERE onu_name=$1 AND resolved=FALSE AND type='offline'`, [hostName]);
        if (ex.rows.length === 0) {
          await client.query(
            `INSERT INTO incidents (onu_name, olt_name, type, severity, offline_hours, power_dbm, description, resolved) VALUES ($1,$2,'offline',$3,$4,$5,$6,FALSE)`,
            [hostName, oltName, severity, offlineHours, powerDbm, `ONU offline há ${Math.floor(offlineHours/24)} dias`]
          );
          if (process.env.WEBHOOK_URL) {
            try {
              const axios = require('axios');
              await axios.post(process.env.WEBHOOK_URL, { message: `🚨 ONU ${hostName} offline há ${Math.floor(offlineHours/24)} dias na ${oltName}`, onu: hostName, olt: oltName, hours: offlineHours, severity });
            } catch (we) { console.warn('[Webhook]', we.message); }
          }
        }
      }
    }
    console.log(`[Collector] Concluído: ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[Collector] ERRO:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { collectData };
