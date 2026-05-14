# Dash Finance

Dashboard pessoal para controle de despesas e receitas mês a mês. Suporte a múltiplos usuários, categorias, parcelas, despesas recorrentes e acompanhamento de investimentos.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- PostgreSQL (Docker) + Prisma 7
- iron-session (autenticação por cookie HTTP-only)

## Setup

**Pré-requisitos:** Node.js 18+, Docker

```bash
# 1. Instalar dependências
npm install

# 2. Subir o banco de dados
docker compose up -d

# 3. Aplicar a migration
npm run db:migrate

# 4. Rodar o projeto
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie sua conta.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste se necessário:

```env
DATABASE_URL=postgresql://dash:dash@localhost:5433/dash_finance
SESSION_SECRET=chave-aleatoria-com-minimo-32-caracteres
```

## Banco de dados

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Porta | `5433` |
| Database | `dash_finance` |
| Usuário | `dash` |
| Senha | `dash` |

```bash
npm run db:studio   # Prisma Studio (interface visual)
npm run db:migrate  # Aplicar novas migrations
```

## Licença

MIT © Josue Lobo
