# Página de profissional

## Objetivo do módulo

Reservar a rota destinada a informações ou gestão de fisioterapeutas.

## Responsabilidades e funcionalidades existentes

Renderiza somente o título “Fisioterapeuta”. Nenhuma lista, formulário, integração ou regra de profissional existe.

## Dependências internas e externas

Não possui imports. Relaciona-se apenas a `Router.tsx` e `AppLayout`.

## Ponto de entrada e fluxo de entrada

Rota `/doctor` → `Doctor` → título estático.

## Arquivo crítico

- `index.tsx`: placeholder completo do módulo.

## Regras próprias do módulo

- Profissional é entidade diferente de usuário e pode existir sem credencial; quando necessário, pode ser vinculado a um usuário.
- Dados confirmados: nome, CPF, CREFITO, telefone, especialidades, serviços executados e dias da semana disponíveis.
- O MVP não configura horários inicial/final, intervalos, férias, salas ou equipamentos.
- Profissionais são compartilhados entre as futuras unidades do mesmo `tenant` e devem ser filtrados pelo serviço que executam.
- Um profissional precisa estar atribuído antes de iniciar ou concluir o atendimento.
- Administrador e usuário básico podem cadastrar profissionais; qualquer restrição adicional permanece não definida.

## Observações técnicas e débitos

- Módulo conectado, mas não funcional.
- As regras de cadastro estão confirmadas em `docs/Requisitos do MVP.md`, mas lista, formulário e integração ainda não existem.
- O nome inglês da rota/pasta contrasta com as rotas em português.
