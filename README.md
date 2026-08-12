# Agendamentos Smart

Aplicação web para gestão de atendimentos especializados, atualmente direcionada pelos textos e fluxos da interface a clínicas de fisioterapia e Pilates.

## Estado atual

O repositório contém uma SPA React com autenticação, consulta de perfil, agenda semanal e gestão inicial de pacientes. A agenda usa dados fixos no cliente; cadastro de usuário, profissionais, configurações e parte da gestão de pacientes ainda estão incompletos. Consulte os documentos oficiais antes de implementar novos fluxos:

- [Arquitetura do Sistema](docs/Arquitetura%20do%20Sistema.md)
- [Objetivo do sistema](docs/Objetivo%20do%20sistema.md)
- [Requisitos do MVP](docs/Requisitos%20do%20MVP.md)
- [Índice da documentação](docs/README.md)
- [Mapa do código-fonte](src/README.md)

## Stack verificada

- React 18, TypeScript 5 e Vite 6;
- React Router 7;
- Axios e TanStack React Query;
- React Hook Form e Zod;
- Tailwind CSS 4, componentes Radix/shadcn e styled-components;
- date-fns para datas;
- json-server como servidor local opcional de dados simulados.

## Execução local

Pré-requisito declarado em `.nvmrc`: Node.js `18.17.1`.

```bash
npm install
npm run dev
```

A aplicação exige `VITE_API_URL` no arquivo `.env.local`. O valor é validado por `src/env.ts` na inicialização.

Para iniciar separadamente o `json-server` com `data.json`:

```bash
npm run dev:server
```

O servidor Vite usa a porta `3000`; o `json-server`, a porta `3333`. Os contratos do mock não cobrem todos os endpoints atualmente chamados pela aplicação.

## Verificação

```bash
npm run build
npx eslint src vite.config.ts
```

O comando `npm run lint` examina o repositório inteiro e, se `dist/` já existir, também analisa o bundle gerado. Essa limitação está registrada na documentação de arquitetura.

## Estrutura principal

| Caminho           | Responsabilidade                                            |
| ----------------- | ----------------------------------------------------------- |
| `src/Router.tsx`  | Rotas públicas e internas                                   |
| `src/_layout/`    | Cascas visuais das rotas                                    |
| `src/page/`       | Páginas e fluxos de tela                                    |
| `src/components/` | Componentes compartilhados e de agenda                      |
| `src/api/`        | Funções HTTP, autenticação local e redirecionamento inicial |
| `src/context/`    | Estado compartilhado de pacientes e datas                   |
| `src/lib/`        | Instâncias e utilitários de infraestrutura                  |
| `data.json`       | Massa de dados do servidor simulado                         |

## Manutenção da documentação

Qualquer alteração de rota, endpoint, dependência, responsabilidade de pasta ou fluxo de negócio deve atualizar o README do módulo afetado e, quando houver impacto transversal, os documentos em `docs/`. Comportamentos planejados devem ser identificados como **Hipótese** ou **não implementado**.

## Regras confirmadas do produto

O MVP atenderá clínicas, profissionais autônomos de fisioterapia, Pilates e áreas relacionadas. O cadastro cria uma clínica, uma unidade padrão e um administrador após validação de e-mail. `tenantId` será a fronteira de dados; a estrutura ficará preparada para futuras unidades de clientes CNPJ.

O primeiro MVP inclui usuários com perfis administrador/básico, pacientes, profissionais, serviços e agenda manual com recorrência, capacidade, bloqueio de conflitos, remarcação e cancelamento auditáveis. Automações de estado, múltiplas unidades operacionais e financeiro ficam para etapas posteriores. A especificação completa está em [Requisitos do MVP](docs/Requisitos%20do%20MVP.md).
