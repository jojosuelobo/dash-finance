@AGENTS.md

# Dash Finance

## Visão Geral

Dashboard pessoal de controle financeiro para acompanhar despesas e receitas mês a mês. Interface em português brasileiro. Aplicação 100% client-side — sem backend, sem banco de dados, sem autenticação. Toda a persistência é feita via `localStorage` do navegador.

## Stack Técnica

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.2.6 | Framework (App Router) |
| React | 19.2.4 | UI |
| TypeScript | 5 | Tipagem |
| Tailwind CSS | 4 | Estilização |

## Estrutura do Projeto

```
app/
  layout.tsx              # Root layout (Header + max-w-4xl wrapper)
  page.tsx                # Página principal — toda a lógica do dashboard
  globals.css             # Import do Tailwind + variáveis de tema

components/
  Header.tsx              # Barra de navegação com o nome do app
  ExpenseList.tsx         # Lista de cards de despesas/receitas
  ExpenseCard.tsx         # Card individual com status visual e ações
  AddExpenseModal.tsx     # Modal de adição de despesa ou receita
  DeleteConfirmModal.tsx  # Confirmação de exclusão com 3 opções
  ManageCategoriesModal.tsx # CRUD de categorias e subcategorias

hooks/
  useExpenses.ts          # Estado de despesas + persistência no localStorage
  useCategories.ts        # Estado de categorias + persistência no localStorage

types/
  expense.ts              # Interfaces Expense e DisplayExpense
  category.ts             # Interfaces Category e Subcategory
```

## Modelos de Dados

### `Expense` (`types/expense.ts`)

```typescript
interface Expense {
  id: string;                              // UUID gerado com crypto.randomUUID()
  name: string;
  value: number;
  type: "fixed" | "one-time";             // Recorrente ou avulsa
  fixedMode?: "unlimited" | "installments"; // Como a fixa recorre
  installments?: number;                   // Quantidade de parcelas
  dueDate?: string;                        // Formato YYYY-MM-DD
  endDate?: string;                        // Formato YYYY-MM (mês final inclusivo)
  excludedMonths?: string[];               // Meses pulados: ["YYYY-MM"]
  paidMonths?: string[];                   // Meses em que foi marcada como paga
  kind?: "expense" | "income";            // Padrão: "expense"
  categoryId?: string;
  subcategoryId?: string;
  createdAt: string;                       // ISO timestamp
}
```

### `DisplayExpense` (`types/expense.ts`)

Extends `Expense` com campos calculados para renderização:

```typescript
interface DisplayExpense extends Expense {
  displayValue: number;       // Para parcelas: value / installments
  installmentInfo?: string;   // Ex: "3/10"
  isPaid: boolean;            // Status no mês visualizado
  isOverdue: boolean;         // Vencida e não paga
  categoryLabel?: string;     // Ex: "Moradia > Aluguel"
}
```

### `Category` / `Subcategory` (`types/category.ts`)

```typescript
interface Subcategory { id: string; name: string; }
interface Category   { id: string; name: string; subcategories: Subcategory[]; }
```

## Lógica de Negócio

### Filtragem mensal (`app/page.tsx`)

A página principal filtra quais despesas aparecem para o mês visualizado (`viewMonth` / `viewYear`):

- **`one-time`**: aparece apenas no mês do `dueDate`.
- **`fixed / unlimited`**: aparece a partir do mês do `dueDate` até o `endDate` (se definido), exceto meses em `excludedMonths`.
- **`fixed / installments`**: aparece por N meses a partir do `dueDate`. O `displayValue` é `value / installments` e o `installmentInfo` indica a parcela atual (ex: "2/10").

### Status de pagamento

- `isPaid`: o mês visualizado está em `paidMonths`.
- `isOverdue`: `dueDate` anterior ao dia atual E `isPaid === false`.
- Ao marcar como pago: o mês é adicionado/removido de `paidMonths` via `updateExpense`.

### Exclusão de despesas recorrentes (`DeleteConfirmModal`)

Três estratégias disponíveis:
1. **Apenas este mês** → adiciona o mês a `excludedMonths`.
2. **Este e todos os próximos** → define `endDate` como o mês anterior ao atual.
3. **Todos os registros** → remove a despesa completamente.

## Componentes

| Componente | Responsabilidade |
|---|---|
| `Header` | Branding estático; suporte a dark mode |
| `ExpenseList` | Renderiza array de `DisplayExpense`; exibe estado vazio |
| `ExpenseCard` | Card com cor por status (verde=pago, vermelho=atrasado, teal=receita); toggle pago; badge de tipo; botão excluir |
| `AddExpenseModal` | Formulário com modo despesa/receita; validação; suporte a vírgula como decimal (PT-BR) |
| `ManageCategoriesModal` | CRUD de categorias e subcategorias (pills removíveis) |
| `DeleteConfirmModal` | Três opções de exclusão contextuais para despesas recorrentes |

## Hooks

### `useExpenses` (`hooks/useExpenses.ts`)

```typescript
const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses();
```

- Chave localStorage: `"dash-finance-expenses"`
- `addExpense` injeta `id` (UUID) e `createdAt` automaticamente.
- `updateExpense(id, partial)` faz merge parcial (patch).

### `useCategories` (`hooks/useCategories.ts`)

```typescript
const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useCategories();
```

- Chave localStorage: `"dash-finance-categories"`
- `deleteCategory` remove a categoria e todas as subcategorias.

## Persistência

Toda a persistência é client-side via `localStorage`. Não há API, banco de dados ou sincronização entre dispositivos. Os dados vivem apenas no navegador local.

| Chave | Conteúdo |
|---|---|
| `dash-finance-expenses` | `Expense[]` serializado em JSON |
| `dash-finance-categories` | `Category[]` serializado em JSON |

## Comandos

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Servidor de produção
```
