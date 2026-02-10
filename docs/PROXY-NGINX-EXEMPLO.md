# Exemplo de proxy reverso (nginx) para SCV

Se o app abre por IP (`http://192.168.1.220:8090/`) mas **não** por domínio (`https://scv.flexibase.com/`), o proxy reverso precisa encaminhar o tráfego para a porta do Vite.

## Exemplo de configuração nginx

Crie ou edite um arquivo em `/etc/nginx/sites-available/scv.flexibase.com` (ou dentro de `conf.d/`):

```nginx
server {
    listen 80;
    server_name scv.flexibase.com;
    # Se usar HTTPS (recomendado), descomente e ajuste:
    # listen 443 ssl;
    # ssl_certificate     /caminho/para/certificado.pem;
    # ssl_certificate_key /caminho/para/chave.pem;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- **proxy_pass**: porta onde o Vite está rodando (8090 no seu caso).
- **Host**: mantém o host original (`scv.flexibase.com`) para o Vite aceitar a requisição.

Depois:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Checklist rápido

1. O Vite está rodando na porta 8090? (PM2 / `npm run dev` com `VITE_DEV_PORT=8090`)
2. O nginx (ou outro proxy) está configurado para `server_name scv.flexibase.com` e `proxy_pass` apontando para `http://127.0.0.1:8090` (ou o IP da máquina onde o Vite roda)?
3. O DNS de `scv.flexibase.com` aponta para o IP do servidor onde está o nginx?
4. No `vite.config.ts` está `allowedHosts: true` para aceitar o host do proxy?

Se ainda não funcionar, verifique os logs do nginx (`/var/log/nginx/error.log`) e do PM2 para ver se a requisição chega ao Vite.
