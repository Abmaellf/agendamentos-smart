# Agendamentos Smart

Aplicação web para gestão de atendimentos especializados, atualmente direcionada pelos textos e fluxos da interface a clínicas de fisioterapia e Pilates.

## Estado atual

O repositório contém uma SPA React com autenticação, consulta de perfil, agenda semanal integrada à API, criação manual de agendamentos e gestão inicial de pacientes. O fluxo manual aplica os padrões do serviço, diferencia `ADMIN`/`BASIC`, permite profissional opcional e atualiza a semana após a criação. Cadastro de profissionais, configurações e parte da gestão de pacientes ainda estão incompletos. Consulte os documentos oficiais antes de implementar novos fluxos:

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
- Tailwind CSS 4 e componentes Radix/shadcn;
- date-fns para datas;
- Vitest, React Testing Library, MSW e Newman para testes de caixa branca e preta.

## Execução local

Pré-requisito declarado em `.nvmrc`: Node.js `18.17.1`.

```bash
npm install
npm run dev -- --host 0.0.0.0
```

A aplicação exige `VITE_API_URL` no arquivo `.env.local`. O valor é validado por `src/env.ts` na inicialização.

O servidor Vite usa a porta `3000`; o `json-server`, a porta `3333`. Os contratos do mock não cobrem todos os endpoints atualmente chamados pela aplicação.

### Ambiente integrado com a API

O ambiente reproduzível validado para a agenda manual usa o backend irmão e Docker Compose:

```bash
cd ../../api-agendamento-smart-api/agendamento-smart-api
docker compose up -d --build
docker compose ps
```

Aguarde a mensagem `Started AgendaSmartApplication` em:

```bash
docker compose logs -f api
```

Depois, neste repositório, confirme `.env.local` com `VITE_API_URL="http://localhost:8082"` e execute o Vite. URLs locais:

- front-end: `http://localhost:3000`;
- API: `http://localhost:8082`;
- MySQL: `localhost:3306`.

Se uma tentativa anterior de subida deixar o contêiner da API fora da rede do banco, preserve o volume e recrie somente a API:

```bash
cd ../../api-agendamento-smart-api/agendamento-smart-api
docker compose stop api
docker compose up -d --force-recreate api
```

As coleções da feature usam slots determinísticos e alteram a massa. Para repetir a suíte completa, use exclusivamente um banco local/CI descartável e restaure a seed `V006`. O comando abaixo apaga **somente o volume Docker desse projeto**, portanto não deve ser usado em ambiente com dados que precisem ser preservados:

```bash
cd ../../api-agendamento-smart-api/agendamento-smart-api
docker compose down -v
docker compose up -d --build
```

O roteiro completo, credenciais e ordem dos testes estão em [Como executar os testes](specs/001-criar-agendamento-manual/como-executar-testes.md).

## Verificação

```bash
npm run build
npm run lint
npm run test:coverage
npm run test:postman:smoke
npm run test:postman
npm run test:postman:race
```

## Estrutura principal

| Caminho           | Responsabilidade                                            |
| ----------------- | ----------------------------------------------------------- |
| `src/Router.tsx`  | Rotas públicas e internas                                   |
| `src/_layout/`    | Cascas visuais das rotas                                    |
| `src/page/`       | Páginas legadas ainda não migradas para features            |
| `src/features/`   | Domínios; `appointments` inclui API, modelo, tela e testes  |
| `src/components/` | Componentes compartilhados e componentes visuais legados    |
| `src/api/`        | Funções HTTP, autenticação local e redirecionamento inicial |
| `src/context/`    | Estado compartilhado legado de pacientes                    |
| `src/lib/`        | Instâncias e utilitários de infraestrutura                  |

## Manutenção da documentação

Qualquer alteração de rota, endpoint, dependência, responsabilidade de pasta ou fluxo de negócio deve atualizar o README do módulo afetado e, quando houver impacto transversal, os documentos em `docs/`. Comportamentos planejados devem ser identificados como **Hipótese** ou **não implementado**.

## Regras confirmadas do produto

O MVP atenderá clínicas, profissionais autônomos de fisioterapia, Pilates e áreas relacionadas. O cadastro cria uma clínica, uma unidade padrão e um administrador após validação de e-mail. `tenantId` será a fronteira de dados; a estrutura ficará preparada para futuras unidades de clientes CNPJ.

O primeiro MVP inclui usuários com perfis administrador/básico, pacientes, profissionais, serviços e agenda manual com recorrência, capacidade, bloqueio de conflitos, remarcação e cancelamento auditáveis. Automações de estado, múltiplas unidades operacionais e financeiro ficam para etapas posteriores. A especificação completa está em [Requisitos do MVP](docs/Requisitos%20do%20MVP.md).
