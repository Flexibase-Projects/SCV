# Deploy e preparação para o GitHub

## Checklist antes do primeiro push

1. [ ] Confirmar que `.env` **não** está sendo rastreado: `git status` (não deve listar `.env`)
2. [ ] Se `.env` foi adicionado por engano: `git rm --cached .env`
3. [ ] Confirmar que `supabase/config.toml` não está no repositório (deve estar no `.gitignore`)
4. [ ] Revisar que `.env.example` contém apenas placeholders, sem valores reais

## Secrets para GitHub Actions

Para o deploy no GitHub Pages funcionar, configure os secrets do repositório:

- **VITE_SUPABASE_URL** – URL do seu projeto Supabase  
- **VITE_SUPABASE_ANON_KEY** – Chave anônima (anon key) do Supabase  
- **VITE_ENABLE_IMPORT** (opcional) – `true` ou `false`; se não definir, o workflow usa `true`

Configuração: **Repositório → Settings → Secrets and variables → Actions → New repository secret**.

## O que o usuário final pode e não pode ver

- **Pode ver (enviar ao GitHub):** código-fonte, `.env.example`, migrations, documentação, `LICENSE`, `SECURITY.md`, workflows (que usam secrets, não valores em texto).
- **Não pode ver (nunca commitar):** `.env`, `supabase/config.toml`, chaves, tokens, senhas, arquivos em `.cursor/` e `.agent/` (preferências locais).

Detalhes completos estão no [README](../README.md#-preparando-para-o-github--o-que-pode-e-o-que-não-pode-ser-enviado) e em [SECURITY.md](../SECURITY.md).
