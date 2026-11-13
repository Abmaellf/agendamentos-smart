# Proposal

## Why

Os campos de paciente, unidade, serviço e profissional do diálogo de novo agendamento exibem hoje listas nativas completas, o que torna a localização lenta quando os catálogos crescem e dificulta a leitura do campo na referência visual. A mudança deve transformar esses quatro selects em campos pesquisáveis, mantendo o formulário atual, os IDs selecionados e as regras já existentes de serviço, profissional opcional e validação.

## What Changes

- Substituir os quatro selects de catálogo do diálogo de criação manual por controles pesquisáveis com abertura de dropdown e ícone de lupa visível.
- Permitir busca textual local por nome de paciente, unidade, serviço e profissional, atualizando as opções sem nova chamada HTTP a cada tecla.
- Definir estados de placeholder, busca sem resultados, carregamento, desabilitado e seleção preservada para cada catálogo.
- Integrar cada controle ao `FormField`, preservando `label`, `id`, `aria-describedby`, mensagem de erro, foco no primeiro campo inválido e leitura por tecnologia assistiva.
- Preservar a dependência do catálogo de profissionais em relação ao serviço selecionado e a opção “Sem profissional”.
- Manter inalterados o payload de criação, os endpoints, as permissões `ADMIN`/`BASIC`, os valores padrão e sobrescritos de duração/preço e o fechamento após sucesso.

Fora de escopo: busca remota, paginação dos catálogos, alteração de endpoints ou contratos HTTP, criação/edição de cadastros, mudança de regras de negócio, troca de unidade ativa, novos filtros por CPF ou outros atributos não exibidos no nome.

## Capabilities

### New Capabilities

- Nenhuma. O comportamento pertence à capacidade existente de agenda e criação manual.

### Modified Capabilities

- `weekly-appointments`: a criação manual passa a oferecer campos de catálogo pesquisáveis, com comportamento acessível e sem alteração do contrato de criação.

## Impact

- Código afetado: diálogo de criação manual em `src/features/appointments/components/`, primitivos ou componente compartilhado de campo pesquisável, `FormField` e testes do diálogo.
- A API continua sendo consultada somente para carregar os catálogos ao abrir o diálogo e para buscar profissionais quando o serviço mudar; a filtragem digitada ocorre no cliente.
- Não há impacto previsto em rotas, dados persistidos, permissões, tenant, dependências externas ou contrato HTTP.
- A documentação do módulo de agenda e, se aplicável, de componentes de UI deverá registrar o novo comportamento observável.
