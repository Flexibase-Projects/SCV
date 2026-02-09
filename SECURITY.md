# Política de Segurança

## O que o usuário final NÃO deve ter acesso (nunca commitar)

Os seguintes itens **não devem** ser enviados ao repositório nem compartilhados publicamente:

| Item | Motivo |
|------|--------|
| Arquivo `.env` | Contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do seu projeto |
| `.env.local`, `.env.production`, `.env.*.local` | Variáveis sensíveis por ambiente |
| `supabase/config.toml` | Contém `project_id` e configurações do projeto Supabase |
| Chaves privadas (`.pem`, `.key`) | Credenciais de acesso |
| Tokens, senhas ou API keys em qualquer arquivo | Risco de vazamento e uso indevido |

O `.gitignore` do projeto já está configurado para ignorar esses arquivos. Antes de cada push, execute `git status` e confira se nenhum arquivo sensível aparece.

## Reportando uma vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança neste projeto:

1. **Não** abra uma issue pública.
2. Entre em contato diretamente com os mantenedores do repositório (por e-mail ou mensagem privada, conforme disponível no perfil do GitHub).
3. Descreva o problema de forma objetiva e, se possível, com passos para reprodução.
4. Aguarde resposta antes de divulgar publicamente a vulnerabilidade.

Agradecemos o reporte responsável e nos comprometemos a responder em tempo hábil.

## Boas práticas para quem faz deploy

- Use **GitHub Secrets** para variáveis de ambiente nos workflows (ex.: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Nunca coloque valores reais em `.env.example` — apenas placeholders ou descrições.
- Revise o histórico antes de abrir um repositório público: `git log -p -- .env supabase/config.toml` (e remova commits que tenham exposto secrets, se necessário).
