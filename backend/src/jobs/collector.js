const { Pool } = require('pg');
const { zabbixCall } = require('../services/zabbixService');
const { getSeverityByOfflineHours, getPowerStatus } = require('../services/incidentService');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ONU_OFFLINE_RE = /^Onu Offline\s*-\s*(.+?)\s+Porta\s+PON-/i;
const ONU_POWER_RE = /^Pot[eê]ncia\s+dBm.+?na\s+ONU\s*-\s*(.+?)\s+Porta\s+PON-.+?-\s*(-?\d+\.?\d*)\s*$/i;

function isOLT(host) {
  return /CBU-.+-OLT\d+/i.test(host.name || host.host || '');
}

async function collectData() {
  console.log(`[Collector] Iniciando: ${new Date().toISOString()}`);
  const client = await pool.connect();
  try {
    const allHosts = await zabbixCall('host.get', {
      output: ['hostid', 'host', 'name'],
      selectInterfaces: ['ip'],
      limit: 5000,
    });

    const oltHosts = allHosts.filter(h => isOLT(h));
    console.log(`[Collector] OLTs encontradas: ${oltHosts.length} →`, oltHosts.map(o => o.name));

    for (const olt of oltHosts) {
      const ip = olt.interfaces?.[0]?.ip || '';
      await client.query(
        `INSERT INTO olts (name, host_id, ip, updated_at) VALUES ($1,$2,$3,NOW())
         ON CONFLICT (name) DO UPDATE SET host_id=$2, ip=$3, updated_at=NOW()`,
        [olt.name || olt.host, olt.hostid, ip]
      );
    }

    const oltHostIds = oltHosts.map(o => o.hostid);

    const activeProblems = await zabbixCall('problem.get', {
      output: ['eventid', 'objectid', 'name', 'clock', 'severity'],
      hostids: oltHostIds,
      recent: false,
      limit: 10000,
    });

    console.log(`[Collector] Problemas ativos: ${activeProblems.length}`);

    const triggerIds = [...new Set(activeProblems.map(p => p.objectid))];
    let triggerMap = {};
    if (triggerIds.length > 0) {
      const triggers = await zabbixCall('trigger.get', {
        output: ['triggerid', 'description'],
        triggerids: triggerIds,
        selectHosts: ['hostid', 'name'],
        limit: 10000,
      });
      for (const t of triggers) {
        triggerMap[t.triggerid] = { host: t.hosts?.[0]?.name || 'Desconhecida' };
      }
    }

    const onuMap = {};
    const powerMap = {};

    for (const problem of activeProblems) {
      const name = problem.name || '';
      const oltName = triggerMap[problem.objectid]?.host || 'Desconhecida';
      const clock = parseInt(problem.clock);
      const offlineHours = (Date.now() / 1000 - clock) / 3600;

      const offlineMatch = name.match(ONU_OFFLINE_RE);
      if (offlineMatch) {
        const onuName = offlineMatch[1].trim();
        const key = `${oltName}|${onuName}`;
        if (!onuMap[key] || offlineHours > onuMap[key].offlineHours) {
          onuMap[key] = { onuName, oltName, offlineHours, clock, status: 'offline' };
        }
        continue;
      }

      const powerMatch = name.match(ONU_POWER_RE);
      if (powerMatch) {
        const onuName = powerMatch[1].trim();
        const dbm = parseFloat(powerMatch[2]);
        powerMap[onuName] = dbm;
      }
    }

    console.log(`[Collector] ONUs offline: ${Object.keys(onuMap).length}`);

    await client.query(`UPDATE onus SET status='online', severity='none', offline_hours=0, offline_since=NULL, updated_at=NOW()`);

    for (const [key, data] of Object.entries(onuMap)) {
      const { onuName, oltName, offlineHours, clock } = data;
      const offlineSince = new Date(clock * 1000);
      const severity = getSeverityByOfflineHours(offlineHours);
      const powerDbm = powerMap[onuName] || null;
      const powerStatus = getPowerStatus(powerDbm);

      await client.query(
        `INSERT INTO onus (name, olt_name, status, offline_since, offline_hours, power_dbm, power_status, severity, last_seen, updated_at)
         VALUES ($1,$2,'offline',$3,$4,$5,$6,$7,NOW(),NOW())
         ON CONFLICT (name) DO UPDATE SET
           olt_name=$2, status='offline', offline_since=$3, offline_hours=$4,
           power_dbm=$5, power_status=$6, severity=$7, last_seen=NOW(), updated_at=NOW()`,
        [onuName, oltName, offlineSince, offlineHours, powerDbm, powerStatus, severity]
      );

      if (severity === 'critico') {
        const ex = await client.query(
          `SELECT id FROM incidents WHERE onu_name=$1 AND resolved=FALSE AND type='offline'`,
          [onuName]
        );
        if (ex.rows.length === 0) {
          await client.query(
            `INSERT INTO incidents (onu_name, olt_name, type, severity, offline_hours, power_dbm, description, resolved)
             VALUES ($1,$2,'offline',$3,$4,$5,$6,FALSE)`,
            [onuName, oltName, severity, offlineHours, powerDbm,
             `ONU offline há ${Math.floor(offlineHours/24)}d ${Math.floor(offlineHours%24)}h`]
          );
          if (process.env.WEBHOOK_URL) {
            try {
              const axios = require('axios');
              await axios.post(process.env.WEBHOOK_URL, {
                message: `🚨 ONU ${onuName} offline há ${Math.floor(offlineHours/24)} dias na ${oltName}`,
                onu: onuName, olt: oltName, hours: offlineHours, severity
              });
            } catch (we) { console.warn('[Webhook]', we.message); }
          }
        }
      }
    }

    for (const [onuName, dbm] of Object.entries(powerMap)) {
      await client.query(
        `UPDATE onus SET power_dbm=$2, power_status=$3, updated_at=NOW() WHERE name=$1`,
        [onuName, dbm, getPowerStatus(dbm)]
      );
    }

    await client.query(
      `UPDATE incidents SET resolved=TRUE, resolved_at=NOW()
       WHERE resolved=FALSE AND type='offline'
       AND onu_name NOT IN (SELECT name FROM onus WHERE status='offline')`
    );

    const stats = await client.query(`SELECT status, COUNT(*) FROM onus GROUP BY status`);
    const crits = await client.query(`SELECT COUNT(*) FROM onus WHERE severity='critico'`);
    console.log('[Collector] Resumo:', stats.rows, `| Críticos: ${crits.rows[0].count}`);
    console.log(`[Collector] Concluído: ${new Date().toISOString()}`);

  } catch (err) {
    console.error('[Collector] ERRO GERAL:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { collectData };
