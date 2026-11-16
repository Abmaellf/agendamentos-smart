# Tasks

## 1. Assets e casca pública compartilhada

- [x] 1.1 Inventariar os assets locais adequados para a identidade Equilíbrio e, se necessário, adicionar somente assets app-local com origem/licença e consumidor registrados em `src/assets/README.md`; verificar que nenhum screenshot completo externo é necessário no bundle. Evidência: `img_pilates.png` foi reutilizado e documentado; a marca foi criada como SVG inline e as referências completas não foram importadas.
- [x] 1.2 Atualizar `AuthLayout` e os estilos compartilhados para compor o painel institucional, logotipo, mensagem, benefícios, rodapé, formas curvas, fundo claro, cartão e ação superior conforme a referência; verificar renderização comum em `/sign-in` e `/sign-up` em viewport ampla e compacta. Evidência: `AuthLayout` e `BrandLogo` implementados; screenshots Chrome headless em 1706 × 922 e 390 × 844 conferidos.
- [x] 1.3 Criar ou ajustar teste da casca pública para verificar a presença da marca, painel institucional, rodapé, conteúdo do cartão e ausência de rolagem horizontal em uma viewport compacta; verificar com o teste direcionado da casca. Evidência: `public-authentication.test.tsx`; suíte direcionada passou.

## 2. Tela de login

- [x] 2.1 Atualizar `SignIn` para o conteúdo visual e semântico da referência, incluindo título, subtítulo, campos, lembrar dispositivo, recuperação de senha, ícones/estados e botão, preservando foco inicial, indicador de envio, toast e navegação existentes; verificar com os testes de login. Evidência: `sign-in.tsx` atualizado; payload e navegação existentes preservados; testes passaram.
- [x] 2.2 Ampliar os testes de `SignIn` para cobrir textos/roles, navegação “Novo Usuário” para `/sign-up`, payload `{ login, password }`, sucesso, erro e estado de envio; verificar com `npm run test -- src/page/auth/__tests__/sign-in.test.tsx`. Evidência: sucesso, erro e loading cobertos em `sign-in.test.tsx`; 3 testes passaram.

## 3. Tela de cadastro e documentação do módulo

- [x] 3.1 Atualizar `SignUp` para o conteúdo visual e semântico da referência, incluindo título, descrição, campos de clínica/e-mail/CPF ou CNPJ, ação “Efetuar login” e botão “Salvar cadastro”, sem adicionar persistência; verificar que a ação de retorno navega para `/sign-in` e que nenhuma chamada de cadastro é iniciada. Evidência: `sign-up.tsx` atualizado; botão sem mutation e retorno superior para `/sign-in` cobertos.
- [x] 3.2 Criar ou ajustar testes de `SignUp` para cobrir campos acessíveis, textos, navegação para login e comportamento visual sem contrato HTTP novo; atualizar `src/page/auth/README.md` para refletir o estado real e verificar com o teste direcionado. Evidência: `public-authentication.test.tsx` passou; README do módulo atualizado.

## 4. Verificação integrada

- [x] 4.1 Executar a validação visual das duas telas nas dimensões de referência (1706 × 922) e em pelo menos uma viewport compacta, conferindo composição, cores, proporções, textos, foco, sobreposição e rolagem horizontal; registrar qualquer desvio que exija nova tarefa. Evidência: screenshots Chrome headless de login/cadastro em 1706 × 922 e de login/cadastro em 390 × 844 conferidos; nenhum overflow horizontal observado.
- [x] 4.2 Executar `npm run lint`, os testes direcionados das telas públicas e `npm run build`; confirmar que as rotas `/sign-in` e `/sign-up`, o contrato `POST /auth/login` e as mensagens de sucesso/erro permanecem funcionando. Evidência: lint aprovado, 5 testes direcionados aprovados e build TypeScript/Vite aprovado.
- [x] 4.3 Executar `openspec validate atualizar-telas-publicas-equilibrio --strict` e atualizar esta lista com a evidência real antes de solicitar arquivamento. Evidência: validação estrita aprovada após a implementação.
- [x] 4.4 Criar `docs/refacto-pagina-login.md` com o passo a passo técnico da refatoração, comparativos “antes/agora”, códigos principais, fluxo, testes e limites do cadastro; atualizar `docs/README.md` e verificar os links e a coerência com o código atual. Evidência: documento criado com 13 seções, índice atualizado e `git diff --check` aprovado.

## Workflow follow-up

- Arquivar a change somente após revisão dos artefatos, implementação concluída e validação estrita aprovada.
