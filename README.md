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
 
 O `.gitignore` ja cobre:
 
 - `node_modules/`
 - `dist/`
 - `.env` e `.env.*`
 
 ### Hardening e Prevenções Aplicadas
 
 - **CSP Rígido (Content-Security-Policy)**: Diretiva `unsafe-inline` removida estritamente de `script-src` via `vercel.json` visando bloqueio de injeção cross-site-scripting.
 - **Rate Limit UI (Cooldowns)**: Formulários sensíveis como de `reenviar-código` e OTP travam em um cronômetro stateful e visual de 60 segundos após envios validados, mitigando spam por triggers legítimos de clientes antes mesmo de tocar os Limiters do Backend.
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

## Status do Projeto

### Progresso geral: ~98%

| Módulo | Status | Detalhes |
|---|---|---|
| Telas financeiras | ✅ Completo | Dashboard, Contas, Cartões, Faturas, Transações, Investimentos |
| Autenticação | ✅ Completo | Login, Cadastro, Recuperação de Senha, Verificação OTP |
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
