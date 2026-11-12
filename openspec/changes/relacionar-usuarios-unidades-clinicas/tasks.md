# Tasks

## 1. Modelo, migração e autorização da API

- [ ] 1.1 Adicionar o relacionamento de usuário com `clinic_unit` e a validação de que a unidade pertence à clínica do usuário; verificar com testes de persistência os casos válido e de clínicas divergentes.
- [ ] 1.2 Criar migração idempotente que associe cada usuário existente à `MATRIZ` da sua clínica, valide previamente as unidades-alvo e preserve os demais atributos; verificar aplicando a migração em uma base com usuários básicos e administradores.
- [ ] 1.3 Restringir a criação e alteração de associação de usuário a administradores autenticados, exigindo clínica e unidade no cadastro; verificar com testes de autorização os retornos de sucesso, campos ausentes e tentativa por usuário não administrador.
- [ ] 1.4 Resolver o escopo de unidades a partir da identidade autenticada — todas as unidades da clínica para `ADMIN` e somente a unidade associada para não administrador — e verificar com testes de serviço/integração os dois papéis.
- [ ] 1.5 Aplicar o escopo resolvido às consultas de pacientes e agendamentos, recusando ou restringindo parâmetros de unidade incompatíveis; verificar que nenhuma resposta expõe dados de outra unidade ou clínica.

## 2. Contrato de sessão e frontend

- [ ] 2.1 Estender o contrato de sessão/perfil para fornecer identificadores e nomes da clínica e da unidade autorizada; verificar com testes de contrato que os valores de sessão esperados são retornados sem segredos.
- [ ] 2.2 Atualizar o modelo e o parser de sessão do frontend para consumir o contexto organizacional com estados seguros de ausência; verificar com testes unitários dos formatos completo e incompleto.
- [ ] 2.3 Exibir os nomes da clínica e da unidade nos detalhes do perfil e na identidade visual, com estado indisponível acessível; verificar os testes dos componentes de perfil/topbar/sidebar e os fluxos de carregamento e falha.
- [ ] 2.4 Adequar a agenda e o catálogo de pacientes ao contrato de escopo retornado pela API, sem realizar filtragem de autorização no cliente; verificar testes MSW/integrados para sessão básica e administrativa.

## 3. Verificação integrada e documentação

- [ ] 3.1 Executar os testes de integração da API com usuários de duas unidades e duas clínicas, comprovando a migração, o acesso total do administrador e o isolamento do usuário não administrador.
- [ ] 3.2 Executar `npm run lint`, os testes frontend afetados e `npm run build`; registrar qualquer falha preexistente com a evidência do comando.
- [ ] 3.3 Atualizar os READMEs e a documentação de contratos afetados com o novo contexto de sessão e as regras de escopo; verificar que os exemplos não tratam o frontend como autoridade.
- [ ] 3.4 Executar `openspec validate relacionar-usuarios-unidades-clinicas --strict` e registrar o resultado antes de solicitar revisão para implementação.

## Workflow follow-up

- Arquivar a change somente após todas as tarefas refletirem evidências reais e as validações de implementação estarem concluídas.
