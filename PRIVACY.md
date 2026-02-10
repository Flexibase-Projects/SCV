# Política de Privacidade de Dados

Este documento descreve como o **Sistema de Controle de Veículos (SCV)** lida com dados no repositório e na aplicação, em conformidade com boas práticas de privacidade e uso no GitHub.

## Escopo

- **Repositório**: Código-fonte e documentação versionados no GitHub.
- **Aplicação**: Sistema web de gestão de frotas (entregas, abastecimento, manutenção, acertos de viagem).

## Dados que NÃO são commitados

Os seguintes itens **nunca** devem ser enviados ao repositório (estão no `.gitignore`):

| Item | Motivo |
|------|--------|
| `.env` e variantes (`.env.local`, `.env.production`, etc.) | Contêm URL do Supabase e chave anônima do projeto |
| `supabase/config.toml` | Contém identificadores e configurações do projeto Supabase |
| Chaves e certificados (`.pem`, `.key`) | Credenciais de acesso |
| `secrets.json` e arquivos de backup de ambiente | Evitar vazamento de segredos |
| Pastas `.cursor/`, `.agent/` | Configurações e logs locais de ferramentas de desenvolvimento |

## Dados tratados pela aplicação

- **Backend**: A aplicação utiliza [Supabase](https://supabase.com) como backend (banco de dados e autenticação, quando configurado).
- **Dados em trânsito**: Comunicação com o Supabase via HTTPS; credenciais (URL e chave anônima) vêm apenas de variáveis de ambiente no ambiente de execução, **nunca** hardcoded no código.
- **Dados no cliente**: O código não envia dados para terceiros além do Supabase configurado pelo titular do deploy. Não há telemetria, analytics ou rastreamento embutido no código de produção.

## Responsabilidade do deploy

- Quem faz o **deploy** da aplicação é responsável por:
  - Manter as variáveis de ambiente (por exemplo, no GitHub Secrets ou no servidor) em local seguro.
  - Configurar políticas de acesso (RLS) no Supabase conforme a necessidade da organização.
  - Garantir que apenas dados necessários para o negócio sejam coletados e armazenados.

## Uso do repositório no GitHub

- O repositório pode ser **público** ou **privado**; em ambos os casos, não inclua arquivos listados na seção "Dados que NÃO são commitados".
- Antes de cada push, confira com `git status` que nenhum arquivo sensível será enviado.
- Em caso de exposição acidental de segredos, altere imediatamente as chaves no Supabase (e em outros serviços) e remova os dados sensíveis do histórico do Git, se necessário.

## Contato

Para dúvidas sobre segurança ou privacidade dos dados, utilize o canal de reporte descrito em [SECURITY.md](./SECURITY.md).
