# Política de Segurança

## Versões Suportadas

Apenas a branch `main` recebe correções de segurança.

## Reportando uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança no Equilibra Frontend, **NÃO abra uma issue pública**. Use um dos canais privados abaixo:

1. **E-mail:** `joaovictooroc@gmail.com`
2. **LinkedIn:** [linkedin.com/in/joaokrv](https://www.linkedin.com/in/joaokrv)
3. **Instagram:** [@joaokrv](https://www.instagram.com/joaokrv)

### Informações úteis ao reportar

- Descrição do problema e impacto potencial
- Passos para reproduzir (idealmente com PoC mínimo)
- Versão/commit afetado
- Mitigações temporárias, se conhecer alguma

### Compromissos do mantenedor

- **Confirmação de recebimento:** até 72 horas
- **Avaliação inicial e severidade (CVSS):** até 7 dias
- **Correção e disclosure coordenado:** prazo combinado conforme severidade

### Escopo

**Dentro do escopo:**
- XSS, CSRF, open redirect, clickjacking
- Vazamentos de token/credencial em storage do browser
- Bypass de route guards (`ProtectedRoute`, `VerifiedRoute`)
- Configurações inseguras (CSP, headers do Vercel, build artefatos)

**Fora do escopo:**
- Falhas de autenticação/autorização que sejam responsabilidade do backend
- Engenharia social contra usuários
- Ataques que exigem acesso físico à máquina do usuário
- Bugs estéticos ou de UX sem impacto de segurança

## Práticas de Segurança Aplicadas

- JWT em memória (Zustand sem `persist` no token) — não exposto a XSS persistente
- Refresh token via cookie httpOnly (defesa anti-XSS)
- Zero sinks de XSS (sem `dangerouslySetInnerHTML`, `eval` ou `innerHTML`)
- Sourcemaps **OFF** em build de produção
- Validação Zod em todas as forms de auth
- Headers do Vercel: CSP estrito (`connect-src 'self' https://*.onrender.com`), HSTS preload, X-Frame-Options DENY, Referrer-Policy
- `swagger.json` removido do tracking (não expõe superfície da API)
- `.gitignore` cobre `.env`, `dist/`, `node_modules/`, `coverage/`
