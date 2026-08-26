# GymFishes — convenções

Leia `docs/superpowers/specs/2026-08-11-gymfishes-design.md` antes de mudar comportamento,
e `docs/superpowers/plans/ROADMAP.md` para saber o que pertence a qual milestone.

## Regra que vence as outras

Nunca complique nada. Simplicidade é uma feature deste produto. Prefira a opção mais enxuta
e diga que preferiu. Melhorar aparência e clareza é bem-vindo; adicionar mecanismos, opções
ou telas não é.

## Idioma

- Interface: **somente pt-BR**. Sem biblioteca de i18n.
- Toda string visível ao usuário vive em `src/lib/strings.ts`. Nenhuma string solta em JSX.
- Números com vírgula decimal, via `formatVolume`.

## Datas

- `America/Sao_Paulo` fixo, em `APP_TZ`.
- Nenhuma aritmética de data fora de `src/lib/dates.ts` e `src/lib/periods.ts`.
- Semana começa na segunda.

## Visual

- Tema escuro apenas. Cores somente via tokens de `src/styles/tokens.css`.
- Preenchimentos planos, bordas de 1px, borda inferior sólida nos botões primários.
- Sem gradientes, sem glow, sem sombra em superfícies.
- Além do azul, só existem verde (confirmação), amarelo (streak) e vermelho (excluir).
- Alvos de toque nunca abaixo de 44px.

## Código

- TypeScript `strict` + `noUncheckedIndexedAccess`. Sem `any`.
- Arquivo passando de ~200 linhas é sinal de que faz coisa demais.
- Lógica pura (rankings, streaks, períodos, formatação) fica em `src/lib/` com teste unitário.
- Componentes leem dados por hooks em `src/features/*`, nunca chamando `supabase` direto.
- `src/lib/database.types.ts` é gerado. Nunca edite à mão.

## Telas

Adicionar uma aba = adicionar uma entrada em `src/app/routes.tsx`. A tab bar se monta a
partir dessa tabela.

## Testes

- Vitest + React Testing Library. `npm run test:run` antes de qualquer commit.
- Teste comportamento pela interface (papéis, textos em pt-BR), não implementação.
- RLS não tem teste automatizado — rode o checklist da seção 11 da spec à mão.

## Banco de dados

O projeto usa um banco Supabase em nuvem — não há stack local de Supabase nem Docker.
Migrations aplicam direto ao projeto na nuvem (a senha vem de `supabase_password` no arquivo
`.env.local` ignorado pelo git). O "sandbox" aqui é o banco de verdade: cuidado ao mudar schema.

**Comandos de banco:**

```bash
supabase db push                              # aplica migrations locais ao projeto em nuvem
supabase gen types --project-id jqhzqkfqifkhxzthbolb  # regenera src/lib/database.types.ts
```

**Tipo-check e build:**

```bash
npm run typecheck                             # verifica tipos TypeScript
npm run watch:test                            # roda testes em modo watch
```

Nunca edite migrations já aplicadas — crie novas.
