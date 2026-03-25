# 📡 OLT Sentinel

## 🚀 Deploy via Portainer (Swarm)

### 1. Suba o código pro GitHub
```bash
git init && git add . && git commit -m "feat: OLT Sentinel"
git remote add origin https://github.com/SEU_USUARIO/olt-sentinel.git
git push -u origin main
```

### 2. GitHub Actions vai buildar as imagens automaticamente
Acompanhe em: `github.com/SEU_USUARIO/olt-sentinel/actions`

### 3. No Portainer
- Stacks → Add Stack
- Cole o conteúdo de `docker-stack.yml`
- Substitua `SEU_USUARIO` pelo seu usuário do GitHub
- Preencha as variáveis de ambiente
- Deploy!

## ⚙️ Variáveis de ambiente (preencher no Portainer)

| Variável | Descrição |
|---|---|
| POSTGRES_PASSWORD | Senha do banco |
| ZABBIX_URL | URL da API Zabbix |
| ZABBIX_TOKEN | Token Zabbix |
| GRAFANA_URL | URL do Grafana |
| GRAFANA_TOKEN | Token Grafana |
| WEBHOOK_URL | (opcional) n8n/Slack |

## 🔐 Segurança
- `backend/.env` está no `.gitignore` — nunca vai pro GitHub
- Tokens ficam apenas no Portainer (environment variables da stack)
