# Acesso ao PostgreSQL de produção via túnel SSH

## Objetivo

Este guia explica como acessar o banco PostgreSQL da aplicação Agendamentos Smart a partir de um programa gráfico, sem publicar o banco na internet.

O procedimento serve para clientes como DBeaver, Beekeeper Studio, pgAdmin ou `psql`. O cliente se conecta a uma porta local no seu computador; o SSH transporta essa conexão até o servidor e, de lá, até o container PostgreSQL.

> **Importante:** este procedimento concede acesso direto aos dados de produção. Use somente credenciais autorizadas, evite alterações destrutivas e não compartilhe usuário, senha, chave SSH ou dumps do banco.

## 1. Como a infraestrutura está organizada

O fluxo de produção é separado em camadas:

```text
Internet
   │
   ├── api-agendamentosmart.com.br:80/443
   │       │
   │       └── Caddy (HTTPS) → API interna:8080
   │                                   │
   │                                   └── PostgreSQL interno:5432
   │
   └── SSH para o servidor
           │
           └── túnel local 127.0.0.1:15432
                         → PostgreSQL interno:5432
```

O domínio `api-agendamentosmart.com.br` aponta para o Caddy nas portas HTTP/HTTPS `80/443`. Ele não aponta para o PostgreSQL na porta `5432`.

Além disso, o Compose de produção não publica a porta do PostgreSQL no host. O banco é acessível pela API dentro da rede Docker, mas não fica diretamente disponível para a internet. Esse bloqueio é intencional: reduz tentativas automatizadas, exposição de credenciais, exploração do protocolo PostgreSQL e risco de alteração direta dos dados.

O frontend também não acessa o banco. Ele chama a API configurada por `VITE_API_URL`; a API é responsável por autenticação, regras de negócio e acesso ao PostgreSQL.

## 2. Por que a conexão direta falha

Não use esta configuração:

```yaml
Host: api-agendamentosmart.com.br
Port: 5432
```

Ela falha porque:

1. o DNS do domínio leva ao servidor/proxy HTTP(S), não ao serviço PostgreSQL;
2. o Caddy atende `80/443`, não o protocolo PostgreSQL em `5432`;
3. a porta `5432` do container não está publicada externamente;
4. o firewall deve bloquear `5432` para conexões públicas.

Portanto, uma conexão recusada em `api-agendamentosmart.com.br:5432` é esperada e indica que a exposição pública do banco não foi criada.

## 3. Pré-requisitos

Antes de começar, tenha:

- acesso SSH ao servidor de produção;
- uma chave SSH ou outro método de autenticação autorizado;
- usuário e senha do banco de produção, obtidos por um canal seguro;
- nome do banco: `agendamento-smart-api`;
- um cliente PostgreSQL instalado localmente;
- uma janela/terminal que possa permanecer aberto enquanto o banco estiver em uso.

O exemplo abaixo usa `root@62.238.8.131` porque esse é o acesso indicado para este servidor. Se existir um usuário SSH administrativo dedicado, prefira-o ao `root`.

## 4. Descobrir o IP interno do PostgreSQL

Esta etapa deve ser executada **no servidor de produção**, depois de conectar por SSH:

```bash
docker inspect -f \
'{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
agendamento-smart-postgres-1
```

O resultado será parecido com:

```text
172.19.0.2
```

Esse endereço é o IP interno do container na rede Docker. Ele não é um endereço público e não deve ser colocado no cliente gráfico como se fosse acessível diretamente do seu computador.

Se o nome do container não existir, descubra o nome atual antes de repetir o comando:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Networks}}'
```

Use o nome do container PostgreSQL que estiver em execução.

## 5. Criar o túnel SSH no computador local

Abra um terminal **no seu computador**, não no servidor, e execute o comando abaixo substituindo `172.19.0.2` pelo IP retornado na etapa anterior:

```bash
ssh -N \
  -L 127.0.0.1:15432:172.19.0.2:5432 \
  root@62.238.8.131
```

Digite a senha/chave SSH quando solicitado. Se a conexão for estabelecida, o terminal normalmente ficará sem novas mensagens. Isso é esperado: `-N` informa ao SSH que não deve abrir um shell remoto; ele ficará mantendo apenas o encaminhamento de porta.

### O que cada parte faz

| Trecho | Função |
| --- | --- |
| `ssh` | abre uma sessão SSH criptografada com o servidor |
| `-N` | não executa comando remoto; mantém somente o túnel |
| `-L` | cria um encaminhamento de porta local |
| `127.0.0.1:15432` | endereço/porta disponíveis somente no seu computador |
| `172.19.0.2:5432` | destino visto a partir do servidor, dentro da rede Docker |
| `root@62.238.8.131` | usuário e endereço SSH do servidor |

Uma versão mais adequada para perceber falhas logo no início e manter a sessão viva é:

```bash
ssh -N -T \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=3 \
  -L 127.0.0.1:15432:172.19.0.2:5432 \
  root@62.238.8.131
```

Não feche esse terminal. Fechar a janela ou pressionar `Ctrl+C` encerra o túnel.

## 6. Verificar se o túnel está ouvindo

Em outro terminal local, teste a porta:

```bash
nc -vz 127.0.0.1 15432
```

Um resultado de sucesso indica que existe um processo local aceitando a conexão. Isso não substitui o teste de autenticação no banco, mas confirma que o encaminhamento local está ativo.

Se `nc` não estiver instalado, abra o cliente gráfico e faça um teste de conexão. Com `psql`, use:

```bash
psql "host=127.0.0.1 port=15432 user=USUARIO_DO_BANCO dbname=agendamento-smart-api sslmode=disable"
```

Digite a senha quando o programa solicitar. Não coloque a senha na linha de comando nem registre a senha em histórico, scripts ou screenshots.

## 7. Configurar o programa de banco

Crie uma conexão PostgreSQL com estes valores:

```text
Host: 127.0.0.1
Port: 15432
Usuário: usuário autorizado do banco de produção
Senha: senha do banco de produção
Banco: agendamento-smart-api
SSL: desativado
SSH Tunnel: desativado
```

O campo `SSH Tunnel` do programa deve ficar desativado porque o túnel já foi criado manualmente no terminal. Ativar os dois mecanismos ao mesmo tempo pode causar conflito, uma segunda conexão SSH desnecessária ou erro de porta.

O `SSL: desativado` reproduz o cenário documentado: o trecho externo é criptografado pelo SSH e o PostgreSQL está na rede Docker interna. Essa configuração não é uma regra universal do PostgreSQL. Se a política do banco exigir TLS próprio, habilite o SSL no cliente e forneça os certificados necessários; isso é separado do túnel SSH.

## 8. Encerrar o acesso

Quando terminar:

1. feche a conexão no programa de banco;
2. volte ao terminal que mantém o SSH;
3. pressione `Ctrl+C`;
4. confirme que o programa não consegue mais conectar a `127.0.0.1:15432`.

O túnel não é um serviço permanente. Ele existe somente enquanto a sessão SSH estiver aberta.

## 9. O que fazer após um novo deploy

Containers Docker podem receber outro IP quando são recriados. Se o IP interno mudar:

1. conecte novamente ao servidor;
2. execute `docker inspect` para obter o IP atual;
3. encerre o túnel antigo;
4. crie outro túnel usando o novo IP;
5. mantenha `Host`, `Porta`, banco e credenciais do cliente iguais.

Não tente resolver essa mudança abrindo `5432` no firewall. O endereço do container é um detalhe interno e deve continuar protegido.

## 10. Troubleshooting

### `Connection refused` em `127.0.0.1:15432`

Verifique se o terminal SSH ainda está aberto, se a porta local não está sendo usada por outro processo e se o comando contém `127.0.0.1:15432`.

### `channel open failed` ou erro de conexão no destino

O túnel chegou ao servidor, mas o servidor não alcançou o destino. Confirme no servidor se o container está em execução e obtenha novamente o IP com `docker inspect`. O IP salvo de um deploy anterior pode ter ficado inválido.

### Erro de autenticação do PostgreSQL

O túnel está funcionando, mas usuário, senha ou nome do banco estão incorretos. Solicite as credenciais pelo canal seguro responsável por produção. Não altere o firewall para resolver erro de login.

### O cliente tenta usar SSL

Ajuste a conexão para `SSL desativado`, conforme a configuração deste procedimento, ou siga a política atual do servidor se o PostgreSQL tiver passado a exigir TLS próprio.

### Tentativa de conectar pelo domínio na porta `5432`

Interrompa essa tentativa e volte para `127.0.0.1:15432`. O domínio é o endereço público do proxy/API; não é o endereço público do banco.

## 11. Regras de segurança da infraestrutura

- Não publique a porta `5432` apenas para usar um programa gráfico.
- Não use `api-agendamentosmart.com.br:5432` como destino do cliente.
- Não altere o encaminhamento para `0.0.0.0:15432`; o túnel deve ficar preso a `127.0.0.1`.
- Remova a regra pública de entrada `5432` do firewall da Hetzner, caso ela exista.
- Mantenha a porta `8080` fechada externamente; a API deve ser alcançada pelo Caddy em `80/443`.
- Mantenha o PostgreSQL sem porta publicada no Compose de produção.
- Use chaves SSH e credenciais do banco por canais seguros; nunca as registre neste repositório.
- Faça alterações de dados somente com autorização e, para operações destrutivas, siga o procedimento de backup e aprovação da produção.

## Resumo rápido

No servidor:

```bash
docker inspect -f \
'{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
agendamento-smart-postgres-1
```

No computador local, substituindo `172.19.0.2` pelo resultado:

```bash
ssh -N \
  -L 127.0.0.1:15432:172.19.0.2:5432 \
  root@62.238.8.131
```

No cliente PostgreSQL:

```text
Host: 127.0.0.1
Port: 15432
Banco: agendamento-smart-api
SSL: desativado
SSH Tunnel: desativado
```
