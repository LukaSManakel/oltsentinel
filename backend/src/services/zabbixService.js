const axios = require('axios');
require('dotenv').config();

const ZABBIX_URL = process.env.ZABBIX_URL;
const ZABBIX_TOKEN = process.env.ZABBIX_TOKEN;
const httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false });

async function zabbixCall(method, params) {
  try {
    const response = await axios.post(
      ZABBIX_URL,
      { jsonrpc: '2.0', method, params, id: Math.floor(Math.random() * 9999) },
      {
        headers: { 'Content-Type': 'application/json-rpc', Authorization: `Bearer ${ZABBIX_TOKEN}` },
        httpsAgent,
        timeout: 15000,
      }
    );
    if (response.data.error) throw new Error(`Zabbix API Error: ${JSON.stringify(response.data.error)}`);
    return response.data.result;
  } catch (err) {
    console.error(`[Zabbix] Erro em ${method}:`, err.message);
    throw err;
  }
}

async function getPowerItems(hostids) {
  if (!hostids || hostids.length === 0) return [];
  const [a, b, c] = await Promise.all([
    zabbixCall('item.get', { output: ['itemid','hostid','name','lastvalue','lastclock'], hostids, search: { name: 'power' }, searchWildcardsEnabled: true, limit: 10000 }),
    zabbixCall('item.get', { output: ['itemid','hostid','name','lastvalue','lastclock'], hostids, search: { name: 'dBm' }, searchWildcardsEnabled: true, limit: 10000 }),
    zabbixCall('item.get', { output: ['itemid','hostid','name','lastvalue','lastclock'], hostids, search: { name: 'optical' }, searchWildcardsEnabled: true, limit: 10000 }),
  ]);
  return [...a, ...b, ...c];
}

async function getHostAvailabilityEvents(hostids) {
  if (!hostids || hostids.length === 0) return [];
  const [t1, t2] = await Promise.all([
    zabbixCall('trigger.get', { output: ['triggerid','description','value','lastchange'], hostids, only_true: true, search: { description: 'unreachable' }, searchWildcardsEnabled: true, selectHosts: ['hostid','name'], limit: 5000 }),
    zabbixCall('trigger.get', { output: ['triggerid','description','value','lastchange'], hostids, only_true: true, search: { description: 'down' }, searchWildcardsEnabled: true, selectHosts: ['hostid','name'], limit: 5000 }),
  ]);
  return [...t1, ...t2];
}

async function getHostsWithAvailability() {
  return zabbixCall('host.get', {
    output: ['hostid','host','name','available','snmp_available'],
    selectInterfaces: ['ip','available'],
    selectGroups: ['groupid','name'],
    limit: 5000,
  });
}

module.exports = { zabbixCall, getPowerItems, getHostAvailabilityEvents, getHostsWithAvailability };
