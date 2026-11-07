# Tasks

## 1. Fluxo do menu e modal

- [x] 1.1 Conectar a opção “Perfil” do `AccountMenu` a um modal controlado, reutilizando o perfil já consultado e verificando com teste que a abertura ocorre sobre a rota atual.
- [x] 1.2 Construir a apresentação responsiva dos dados seguros (`username`/login, papel, clínica e avatar), omitindo senha e estados sem dados; verificar com testes de conteúdo e ausência de segredo.
- [x] 1.3 Implementar fechamento visível, Escape, cancelamento e retorno de foco ao acionador; verificar com teste de acessibilidade/interação do modal.

## 2. Download da foto

- [x] 2.1 Adicionar a ação “Baixar foto” apontando para a mesma imagem exibida no topbar, com nome de arquivo identificável e sem request HTTP adicional; verificar com teste do atributo/ação de download.
- [x] 2.2 Tratar a ausência de imagem sem criar ação de download inválida e comunicar a indisponibilidade; verificar com teste do estado sem foto.

## 3. Integração e verificação

- [x] 3.1 Atualizar ou ampliar os testes do `AccountMenu` e do `AppTopbar` para cobrir o acesso pelo avatar, a abertura do modal e a preservação dos controles existentes; verificar com a suíte direcionada.
- [x] 3.2 Executar `npm run lint`, `npm run build` e `openspec validate abrir-modal-perfil-download-foto --strict`; lint e validação estrita aprovados, enquanto o build permanece bloqueado pelos erros TypeScript preexistentes do calendário legado em `src/components/Card/CardDay/index.tsx` e `src/components/__tests__/legacy-calendar-components.test.tsx`.

## Workflow follow-up

- Após a revisão e a implementação concluída, arquivar a change somente depois de validar os artefatos e atualizar a spec principal.
