# Design

## Context

O `CardDay` deixou de usar `date-fns` para filtrar datas e passou a calcular a data local com `Intl.DateTimeFormat`, usando o fuso do agendamento. Os imports antigos permaneceram no topo do arquivo e são rejeitados pelo TypeScript estrito e pelo ESLint.

## Goals / Non-Goals

**Goals:**

- Remover somente os imports mortos.
- Manter intacta a lógica de data, o markup, as classes e o contrato de props.
- Confirmar que o mesmo comando usado pela Vercel passa localmente.

**Non-Goals:**

- Não trocar o target ES2020.
- Não refatorar o componente.
- Não atualizar dependências deprecated.
- Não alterar a agenda ativa, API ou rotas.

## Decisions

### Remoção direta dos imports

Remover `format` e `ptBR` é suficiente porque nenhum símbolo desses módulos é usado após a migração. Reintroduzir `date-fns` apenas para silenciar o erro adicionaria lógica redundante e poderia desfazer o cálculo por fuso.

### Verificação proporcional

Executar primeiro `npm run build`, depois `npm run lint` e o teste direcionado de pacotes. O build é a verificação principal porque reproduz exatamente a falha reportada pela Vercel.

## Risks / Trade-offs

- **[Risco]** Existir algum uso indireto dos imports removidos → **Mitigação:** TypeScript, ESLint e teste de build detectam referências ausentes.
- **[Risco]** O erro reportado ser acompanhado por outro erro oculto → **Mitigação:** executar o build completo após a remoção.

## Migration Plan

Não há migração. A alteração é local, reversível pelo Git e não muda dados ou contratos externos.
