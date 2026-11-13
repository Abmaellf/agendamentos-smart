# Design

## Context

Consulte `proposal.md` e os deltas de `weekly-appointments` e `access-session-baseline`. A sessão do frontend já normaliza `ADMIN`/`BASIC` e possui `activeUnitId`; o diálogo carrega catálogos ao abrir, mas atualmente inicia `unitId` vazio e deixa o controle editável para ambos os papéis.

## Goals / Non-Goals

**Goals:**

- Fazer a unidade ativa da sessão ser a fonte inicial do formulário BASIC.
- Manter o ADMIN com seleção de unidades autorizadas.
- Preservar a fronteira entre apresentação e autorização: a API fornece o catálogo autorizado e valida a criação.
- Cobrir ausência, carregamento, erro e incompatibilidade entre `activeUnitId` e catálogo.

**Non-Goals:**

- Criar múltiplas associações de unidade no modelo atual.
- Implementar troca de unidade para BASIC ou filtrar autorização depois que os dados chegam ao navegador.
- Alterar o payload de criação ou as regras de duração/preço.

## Decisions

### Inicializar após o catálogo autorizado

O formulário manterá o valor controlado, mas uma sessão BASIC só poderá receber `activeUnitId` quando esse identificador estiver presente no catálogo devolvido pela API. O valor não será inferido pela primeira opção, pois isso poderia selecionar uma unidade incorreta durante uma resposta incompleta.

### Desabilitar o controle, não ocultá-lo

O campo Unidade continuará visível, com nome, valor e estado acessíveis, porém desabilitado para BASIC. Para ADMIN, o mesmo `SearchableSelect` continuará editável. A duplicação de controles por papel foi rejeitada para manter um único contrato visual e de teste.

### Não fazer filtragem de segurança no cliente

O frontend renderizará somente os catálogos recebidos e não fará chamadas por tecla nem tentará juntar respostas de endpoints diferentes para ampliar opções. A API permanece responsável por escopo, tenant e validação do payload.

### Verificar o papel na fronteira do formulário

Os testes usarão sessões ADMIN e BASIC, conferindo valor inicial, atributo `disabled`, payload e ausência de chamadas extras. O mesmo princípio será aplicado a futuros componentes de pesquisa de usuários, unidades, pacientes e profissionais.

## Risks / Trade-offs

- [Catálogo BASIC vazio ou inconsistente] → bloquear a criação e comunicar indisponibilidade, sem fallback para a primeira unidade.
- [Sessão e API implantadas em versões diferentes] → tolerar carregamento transitório, mas não habilitar seleção arbitrária quando `activeUnitId` não puder ser validado.
- [Testes existentes esperam unidade vazia] → atualizar apenas fixtures e expectativas afetados, preservando payloads e cenários ADMIN.

## Migration Plan

1. Ajustar o modelo de estado e a integração do diálogo.
2. Atualizar mocks/fixtures para respostas escopadas por papel.
3. Cobrir BASIC, ADMIN, erro e catálogo vazio nos testes frontend.
4. Atualizar READMEs dos módulos afetados e executar testes direcionados, lint, build e validação OpenSpec.

Rollback: reverter a inicialização/bloqueio do controle e os fixtures da change; não remover campos de sessão nem alterar a autorização da API.
