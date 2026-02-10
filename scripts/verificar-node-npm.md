# Node e npm no Windows – se não reconhecer

## O que já está ok
- **Node:** instalado em `C:\Program Files\nodejs\`
- **npm:** vem junto com o Node (já está aí)
- Neste projeto, `npm install` já foi executado com sucesso.

## Se em algum terminal der "npm não é reconhecido"

### 1. Fechar e abrir de novo
Feche **todas** as janelas do terminal (PowerShell, CMD, Cursor) e abra uma nova. O PATH é carregado quando o terminal inicia; se o Node foi instalado com o terminal já aberto, esse terminal não vê o npm.

### 2. Reiniciar o PC
Depois de instalar o Node, às vezes só reiniciar o PC atualiza o PATH em todos os programas.

### 3. Colocar Node no PATH manualmente (só se ainda falhar)
1. Aperte **Win + R**, digite `sysdm.cpl` e Enter.
2. Aba **Avançado** → **Variáveis de Ambiente**.
3. Em "Variáveis do usuário" (ou do sistema), selecione **Path** → **Editar**.
4. Verifique se existe: `C:\Program Files\nodejs`
5. Se não existir: **Novo** → cole `C:\Program Files\nodejs` → OK em tudo.
6. Feche e abra de novo **todos** os terminais.

### 4. Testar
Numa **nova** janela do PowerShell ou CMD:
```powershell
node -v
npm -v
```
Os dois devem mostrar versão (ex.: v24.x.x e 11.x.x).

### 5. Usar o terminal do Cursor
No Cursor, o terminal integrado já está usando o PATH onde o Node aparece. Você pode rodar `npm run dev`, `npm install`, etc. daqui.
