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

## Integracao com Backend

Durante desenvolvimento, o Vite faz proxy para o backend local:

- `/api` -> `http://127.0.0.1:8080`
- `/api-docs` -> `http://127.0.0.1:8080`

> Importante: utilizar `127.0.0.1` para manter compatibilidade do fluxo de geracao de cliente OpenAPI.

### Producao (Vercel)

- Defina `VITE_API_BASE_URL` com a URL publica do backend (ex: Render/Railway).
- Nao use URL do proprio frontend nessa variavel.
- Sem essa variavel, chamadas da API podem cair em rotas relativas (`/api/*`) do frontend e falhar (ex: 405).

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

## Como Executar

### Requisitos

- Node.js 18+
- npm 9+
- Backend Equilibra rodando em `http://127.0.0.1:8080`

### Passo a passo

```bash
# 1) Instalar dependencias
npm install

# 2) Rodar em modo desenvolvimento
npm run dev
```

Aplicacao disponivel em:

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

---

## Status do Projeto

### Progresso geral: ~95%

Implementado:

- Modulos centrais de gestao financeira
- Dashboard com indicadores e graficos
- Fluxos de autenticacao e recuperacao de senha
- Internacionalizacao de interface
- Integracao completa com backend

Em evolucao:

- Refinamentos de UX/UI
- Otimizacao de chunking do bundle para producao

### Checklist objetivo (auditoria)

- Build de producao: ✅ OK
- Lint: ✅ Sem erros bloqueadores (warnings ainda existentes)
- CI do frontend: ⚠️ Nao ha workflow versionado em `.github/workflows`
- I18n da interface: ✅ Implementado (pt-BR e en-US)
- Integracao com backend local via proxy Vite: ✅ OK
- Seguranca de arquivos locais (`.env`): ✅ Coberto no `.gitignore`

---

## Observacoes

- Este repositório representa o **frontend** da aplicacao.
- O backend possui repositório e ciclo de deploy independentes.
