# Tasks

## 1. Estrutura e ferramentas SDD

- [x] 1.1 Instalar OpenSpec 1.16.0 e inicializar `openspec/`; verificar a estrutura criada com `openspec status`.
- [x] 1.2 Instalar CodeGraph 1.6.2, configurar a integração Codex e inicializar o índice local; verificar com `codegraph status`.
- [x] 1.3 Versionar `AGENTS.md`, a configuração OpenSpec e o guia operacional; verificar links e comandos documentados.

## 2. Inventário de capacidades entregues

- [x] 2.1 Rastrear shell, sessão, agenda e pacientes com CodeGraph e leitura dos arquivos/testes; registrar fontes e limites no guia SDD.
- [x] 2.2 Criar deltas OpenSpec para cada capability observada; verificar cenários e requisitos com `openspec validate`.
- [x] 2.3 Registrar explicitamente fluxos incompletos e divergências de build/testes, sem alterar runtime; verificar a seção de lacunas conhecidas.

## 3. Validação e promoção

- [x] 3.1 Executar lint, build e testes de cobertura para capturar a linha de base; registrar resultados reais no guia.
- [x] 3.2 Validar a change e todas as specs em modo estrito; promover os deltas ao catálogo de specs com `openspec archive`.
