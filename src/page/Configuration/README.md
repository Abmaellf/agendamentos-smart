# Página de configuração

## Objetivo do módulo

Reservar a rota de configurações da aplicação.

## Responsabilidades e funcionalidades existentes

`Configuration` renderiza apenas um `div` vazio. Não há configuração funcional.

## Dependências internas e externas

Não possui imports. Relaciona-se somente a `Router.tsx` e `AppLayout`.

## Ponto de entrada e fluxo de entrada

Rota `/configuration` → componente vazio.

## Arquivos críticos

- `index.tsx`: placeholder;
- `styles.tsx`: arquivo vazio e órfão.

## Regras próprias do módulo

- A configuração do MVP deve representar os dados básicos da clínica e da unidade padrão, sempre no `tenantId` da sessão.
- Cliente CPF permanece com uma unidade. Cliente CNPJ fica estruturalmente preparado para várias, mas criação/gestão efetiva de novas unidades é da segunda etapa e do usuário master da plataforma.
- Somente administrador acessa alterações restritas da clínica, configura duração/preço padrão do serviço e pode sobrescrevê-los em um agendamento; usuário básico apenas utiliza os valores definidos.
- Capacidade é definida por serviço, entre 1 e 10, e não por turma individual.
- O primeiro MVP não configura financeiro, salas, equipamentos, intervalos, férias, lembretes nem automações de status.

## Observações técnicas e débitos

- Módulo conectado, mas não funcional.
- As regras de produto acima estão confirmadas, mas o componente continua vazio e não deve ser descrito como implementado.
- Pasta em PascalCase e rota em inglês divergem das convenções predominantes.
