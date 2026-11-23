# Design

## Context

O frontend deste repositório chama uma API externa configurada por `VITE_API_URL`; ele não acessa o PostgreSQL diretamente. Em produção, o domínio `api-agendamentosmart.com.br` aponta para o Caddy, que publica `80/443` e encaminha as requisições HTTPS para a API interna. O PostgreSQL permanece sem porta publicada no host e pode ser alcançado pela API dentro da rede Docker.

O acesso administrativo ao banco precisa funcionar a partir de um computador local sem criar uma nova superfície pública de ataque.

## Goals / Non-Goals

**Goals:**

- Explicar o caminho de rede do túnel SSH em linguagem operacional.
- Fornecer comandos reproduzíveis para o servidor e para o computador local.
- Deixar explícitos os valores que devem ser configurados no cliente PostgreSQL.
- Orientar verificações e recuperação para falhas comuns.

**Non-Goals:**

- Alterar o `docker-compose` de produção, Caddy, firewall, DNS ou credenciais.
- Publicar a porta `5432` ou recomendar conexão direta pelo domínio.
- Substituir as regras de autorização da API ou transformar o frontend em cliente do banco.

## Decisions

### Usar encaminhamento local SSH

O comando `ssh -L` cria um ponto de acesso somente em `127.0.0.1:15432`. O SSH transporta os bytes até o servidor e, a partir dele, conecta ao IP interno do PostgreSQL na porta `5432`. Isso mantém a porta do banco fechada para a internet e evita confundir o endpoint HTTPS da API com o endpoint do banco.

### Usar a porta local `15432`

Uma porta local diferente de `5432` deixa visível que o cliente está falando com um encaminhamento e reduz conflitos com uma instalação local de PostgreSQL. O número é arbitrário; se for trocado, deve ser trocado também na configuração do cliente.

### Descobrir o IP do container após deploy

O IP `172.19.0.2` é um exemplo, não um contrato durável. O guia manda consultar `docker inspect` no servidor sempre que o container for recriado, porque o Docker pode atribuir outro IP à rede interna.

### Manter o SSL do cliente desativado conforme o cenário documentado

Neste fluxo, a proteção do transporte entre o computador local e o servidor é fornecida pelo SSH, e o trecho servidor–container ocorre na rede Docker interna. O guia usa `SSL: desativado` para reproduzir a configuração fornecida. Se a política do PostgreSQL passar a exigir TLS próprio, o cliente deverá ser reconfigurado; isso é independente do túnel SSH.

## Risks / Trade-offs

- **[IP interno pode mudar]** → Executar novamente `docker inspect` após recriar o container e reconstruir o túnel.
- **[Túnel encerrado ou terminal fechado]** → Manter a sessão aberta, usar `ExitOnForwardFailure` e validar a porta local antes de abrir o cliente.
- **[Porta local já ocupada]** → Escolher outra porta local e usar o mesmo valor no túnel e no cliente.
- **[Exposição acidental do serviço]** → Vincular o encaminhamento a `127.0.0.1`; não usar `0.0.0.0`, não publicar `5432` e não abrir a porta no firewall.
- **[Duplicação de túnel]** → Como o túnel é criado manualmente no terminal, deixar o recurso `SSH Tunnel` do programa gráfico desativado.
