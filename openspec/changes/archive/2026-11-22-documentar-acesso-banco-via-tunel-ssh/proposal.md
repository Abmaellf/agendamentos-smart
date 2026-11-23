# Proposal

## Why

O PostgreSQL de produção não é publicado na internet, enquanto o domínio público da aplicação termina no Caddy nas portas `80/443`. Sem um guia operacional, é fácil tentar conectar um cliente gráfico ao domínio na porta `5432` ou abrir essa porta no firewall, enfraquecendo a segurança da infraestrutura.

## What Changes

- Criar um guia em `docs/` explicando a topologia de produção e o motivo de o PostgreSQL permanecer acessível somente na rede Docker interna.
- Documentar, passo a passo, como descobrir o IP interno do container, criar o túnel SSH e configurar um cliente PostgreSQL local.
- Incluir verificações, troubleshooting, encerramento do túnel e cuidados com firewall, credenciais e IPs dinâmicos de containers.
- Atualizar o índice de documentação para tornar o guia localizável.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. Esta é uma alteração documental e operacional; não altera código, rotas, contratos HTTP, dependências, dados ou permissões da aplicação. O gate `skip_specs: true` é usado porque não há requisito comportamental novo.

## Impact

- Documentação: novo guia de acesso operacional e novo link no índice de `docs/`.
- Infraestrutura: nenhuma alteração executada; o documento descreve o túnel SSH e reforça que `5432` e `8080` devem permanecer fechadas externamente.
- Segurança: nenhum segredo real será registrado; usuário e senha do banco aparecem apenas como valores a serem fornecidos no ambiente seguro.
