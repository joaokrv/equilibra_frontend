# Equilibra - Frontend

Frontend web da aplicacao **Equilibra**, responsavel pela experiencia do usuario na gestao de contas, cartoes, faturas, transacoes, investimentos e perfil.

---

## A ideia

O frontend do Equilibra substitui planilhas por uma interface unica, com navegação protegida por autenticacao, atualizacao em tempo real com cache inteligente e componentes focados no dia a dia financeiro.

Objetivos principais:

- Exibir dados financeiros de forma clara e acionavel
- Reduzir operacoes manuais com formularios e regras de negocio orientadas por API
- Oferecer experiencia moderna em desktop e mobile
- Suportar internacionalizacao de interface (pt-BR e en-US)

---

## Stack Tecnica

| Camada | Tecnologia |
|---|---|
| Framework UI | React 19 |
| Linguagem | TypeScript 5 |
| Build Tool | Vite 8 |
| Estilizacao | Tailwind CSS 4 |
| Roteamento | React Router |
| Data Fetching | TanStack React Query |
| Estado Global | Zustand |
| Formularios | React Hook Form + Zod |
| Graficos | Recharts |
| HTTP | Axios |
| Lint | ESLint 9 |

---

## Arquitetura

O frontend segue separacao por responsabilidade:

```
pages/ -> components/ -> hooks/ -> api/
                 |         |
               store/     lib/
```

### Organizacao de pastas

- `src/pages/`: telas da aplicacao (Dashboard, Contas, Cartoes, Perfil, etc)
- `src/components/`: componentes reutilizaveis (`ui`, `layout`, `dashboard`, `modals`)
- `src/hooks/`: composicao de dados com React Query
- `src/store/`: estados globais (autenticacao, toast, idioma)
- `src/api/`: cliente OpenAPI gerado automaticamente
- `src/lib/`: formatadores, constantes e utilitarios

---

## Fluxos Principais

### Rotas e protecao

O roteamento possui tres guardas:

- `PublicRoute`: bloqueia acesso a login/cadastro quando ja autenticado
- `ProtectedRoute`: exige autenticacao
- `VerifiedRoute`: exige email verificado para modulos financeiros

### Verificacao de e-mail (OTP)

- O cadastro inicia um pre-registro e abre o modal de OTP.
- No login, se o backend retornar `EMAIL_NAO_VERIFICADO`, o modal e aberto e informa que o codigo foi enviado.
- O modal usa o status do servidor e nao expira localmente.
- Estados padronizados: ATIVO, EXPIRADO, BLOQUEADO, USADO.
- Countdown exibido para expiraEm, bloqueadoAte e proximoReenvioEm.
- `registroId` salvo em sessionStorage para restaurar o fluxo apos refresh.

### Estado global

- `useAuthStore`: usuario autenticado, token e estado de sessao
- `useToastStore`: notificacoes globais
- `useI18nStore`: idioma da interface com persistencia em `localStorage`

### Internacionalizacao

- Idiomas suportados: `pt-BR` e `en-US`
- Idioma pode ser alterado em `Perfil`
- Persistencia por chave local `equilibra-language`

---

## Integração com Backend

### Desenvolvimento local

O Vite faz proxy automático para o backend local:

- `/api` → `http://127.0.0.1:8080`
- `/api-docs` → `http://127.0.0.1:8080`

> Importante: utilizar `127.0.0.1` (e não `localhost`) para compatibilidade com o fluxo de geração do cliente OpenAPI.

### Produção

- Defina a variável `VITE_API_BASE_URL` com a URL pública do backend.
- Sem essa variável, chamadas da API caem em rotas relativas (`/api/*`) do próprio frontend e falham.

---

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
npm run api:generate
```

Descricao:

- `npm run dev`: inicia frontend em desenvolvimento
- `npm run build`: compila TypeScript e gera bundle de producao
- `npm run lint`: executa ESLint
- `npm run preview`: serve build localmente
- `npm run api:generate`: baixa `/api-docs` e regenera `src/api/`

---

## Como Executar Localmente

### Requisitos

| Ferramenta | Versão Mínima |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Backend Equilibra | Rodando em `http://127.0.0.1:8080` |

### Início rápido

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd frontend

# 2. Instalar dependências
npm install

# 3. Rodar em modo desenvolvimento
npm run dev
```

Aplicação disponível em:

- `http://localhost:5173`

---

## Qualidade e Manutencao

- Build validado com `npm run build`
- Lint validado com `0 errors` (warnings pendentes)
- `src/api/` e codigo gerado por OpenAPI: evitar edicao manual

Boas praticas:

- Priorizar componentes reutilizaveis em `components/ui`
- Centralizar chamadas de API em hooks/servicos
- Evitar regras de negocio de dominio no componente visual

---

## Seguranca
 
 - Nao armazenar secrets no frontend
 - Tokens de autenticacao devem ser tratados somente pelo fluxo de auth
 - Nunca commitar arquivos `.env` locais
 - Mensagens de erro neutras no cadastro para evitar enumeracao de e-mail
 - Timers do OTP baseados no servidor (nao confiar no relogio local)
 
 O `.gitignore` ja cobre:
 
 - `node_modules/`
 - `dist/`
 - `.env` e `.env.*`
 
 ### Hardening e Prevenções Aplicadas
 
 - **CSP Rígido (Content-Security-Policy)**: Diretiva `unsafe-inline` removida estritamente de `script-src` via `vercel.json` visando bloqueio de injeção cross-site-scripting.
 - **Rate Limit UI (Cooldowns)**: Formulários sensíveis respeitam cooldowns de OTP (1 min para tentativa e 5 min para reenvio) com countdown visual sincronizado com o backend.
 - **Mensagens Neutras**: erros de cadastro evitam confirmar se o e-mail existe.
 - **Proteções de Depreciação**: Remoção preventiva do cabeçalho datado `X-XSS-Protection`, delegando total proteção aos browsers modernos via CSP.
 
 ---

## Deploy

A aplicação está em produção utilizando plataforma de hospedagem estática com CDN:

| Componente | Detalhes |
|---|---|
| Hospedagem | Plataforma de deploy automático via branch `main` |
| CDN | Distribuição global com cache otimizado |
| Headers de Segurança | CSP, HSTS, X-Content-Type-Options, Referrer-Policy |

### Variáveis de ambiente em produção

| Variável | Descrição |
|---|---|
| `VITE_API_BASE_URL` | URL pública da API REST do backend |

> Configurada diretamente no painel da plataforma de hospedagem. Nenhum segredo é armazenado no código.

---

## Próximos Passos

### 🤖 Bot WhatsApp com IA Integrada

A próxima evolução do Equilibra é a **integração com WhatsApp via Bot inteligente**, permitindo ao usuário registrar movimentações sem abrir o app web.

**Visão:**

- Registrar **receitas**, **despesas** e **investimentos** por mensagem natural no WhatsApp
- IA interpreta a intenção do usuário (ex: *"gastei 35 reais no almoço hoje no Nubank"*) e cria a transação na categoria correta
- Consultar **saldo**, **fatura aberta** e **limite disponível** por chat
- Alertas proativos: vencimento de fatura, meta atingida, gasto fora do padrão
- Sincronização total: toda movimentação criada via WhatsApp aparece imediatamente no Dashboard web

**Impacto no frontend:**

- Nova seção no Perfil para vincular número de WhatsApp e gerenciar preferências de notificação
- Indicador no Dashboard de movimentações criadas via bot (origem `WHATSAPP`)
- Sem mudanças disruptivas no fluxo atual — o web continua sendo a interface primária

> Status: **planejamento**. A interface web já consome a API REST que será compartilhada com o bot.

---

## Reportando Vulnerabilidades

Consulte [`SECURITY.md`](SECURITY.md) para o procedimento de disclosure responsável.

---

## Status do Projeto

### Progresso geral: ~98%

| Módulo | Status | Detalhes |
|---|---|---|
| Telas financeiras | ✅ Completo | Dashboard, Contas, Cartões, Faturas, Transações, Investimentos |
| Autenticação | 🔄 Em atualização | Pre-registro com OTP obrigatório, modal com countdown e novos estados |
| Internacionalização | ✅ Completo | pt-BR e en-US com persistência |
| Perfil do usuário | ✅ Completo | Foto, dados, alteração de e-mail e senha |
| CI (GitHub Actions) | ✅ Completo | Workflow lint + build a cada push/PR |
| Hardening de Segurança | ✅ Completo | CSP rígido, cooldowns UI, headers modernos |
| Deploy produção | ✅ Completo | Hospedagem estática com CDN |

### Checklist (auditoria)

- Build de produção: ✅ OK
- Lint: ✅ Sem erros bloqueadores
- CI: ✅ Workflow `ci.yml` (lint + build a cada push/PR na main)
- I18n da interface: ✅ Implementado (pt-BR e en-US)
- Integração com backend via proxy Vite: ✅ OK
- Segurança de arquivos locais (`.env`): ✅ Coberto no `.gitignore`
- Deploy produção: ✅ Ativo e funcional
