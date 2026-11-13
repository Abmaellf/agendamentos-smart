# Features por domínio

## Objetivo

`src/features/` concentra código específico de domínios funcionais. Cada
feature é responsável pela composição da própria tela, componentes de negócio,
modelo, adaptadores HTTP e testes, quando essas responsabilidades existirem.

## Convenção

```text
features/<domain>/
├── api/          # contratos e adaptadores HTTP do domínio
├── components/   # componentes específicos da feature
├── model/        # schemas, transformações e regras locais
├── pages/        # composição das rotas do domínio
├── __tests__/    # testes unitários, de contrato e integração
└── README.md     # contexto, fluxo, contratos e lacunas quando necessário
```

As subpastas são criadas somente quando houver conteúdo correspondente. UI
genérica permanece em `src/components/ui`; infraestrutura compartilhada
permanece em `src/lib`; contratos de domínio compartilhados permanecem em
`src/@types`.

## Matriz de migração e expansão

| Domínio | Estado | Local canônico | Escopo desta change |
| --- | --- | --- | --- |
| `appointments` | Implementado parcialmente | `src/features/appointments` | Referência estrutural; sem migração funcional |
| `patients` | Em migração | `src/features/patients` | Migrar página, componentes, contexto, API, testes e documentação |
| `session` | Contrato parcial | `src/features/session` | Preservar modelo existente; `activeUnitId` inicializa controles BASIC sem substituir a autorização da API |
| `professionals` | Planejado | `src/features/professionals` | Não criar fluxo nesta change |
| `services` | Planejado | `src/features/services` | Não criar fluxo nesta change |
| `reports` | Planejado | `src/features/reports` | Não criar fluxo nesta change |
| `financial` | Planejado | `src/features/financial` | Não criar fluxo nesta change |
| `users` | Planejado | `src/features/users` | Não criar fluxo nesta change |

Os nomes das features usam plural em inglês, alinhados a `appointments` e ao
alias de domínio. Rotas e textos de interface podem preservar o contrato atual,
como `/paciente`, enquanto a organização interna evolui.

## Dependências

O fluxo preferencial é:

```text
Router/App → feature pages → feature components/model → feature api → lib
```

Módulos compartilhados não importam features para executar regras de negócio.
Quando um contrato for usado por mais de um módulo, ele deve ser definido uma
única vez em `src/@types` e consumido com `import type`. Tipos triviais usados
por um único consumidor podem permanecer locais.

## Estado atual e lacunas

Esta convenção não declara os domínios planejados como implementados. A feature
de pacientes mantém, durante esta mudança, os dois fluxos de criação legados e
seus contratos HTTP observados. Unificação de cadastro, edição, desativação,
paginação real e autorização continuam dependendo de changes funcionais
próprias.
