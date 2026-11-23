# Tasks

## 1. Documentar a topologia e o procedimento

- [x] 1.1 Criar `docs/acesso-banco-producao-via-tunel-ssh.md` com a topologia Caddy/API/PostgreSQL, a explicação do bloqueio da conexão direta e o passo a passo completo; verificar a presença dos comandos `docker inspect`, `ssh -L` e dos parâmetros do cliente PostgreSQL.
- [x] 1.2 Incluir no guia segurança, validação, troubleshooting, encerramento do túnel e comportamento esperado após mudança do IP do container; verificar que nenhum segredo real foi registrado.

## 2. Integrar e validar a documentação

- [x] 2.1 Adicionar o guia ao índice `docs/README.md` e conferir que o link relativo aponta para o arquivo correto.
- [x] 2.2 Executar `openspec validate documentar-acesso-banco-via-tunel-ssh --strict` e `git diff --check`; confirmar que a alteração não toca código, dependências ou a alteração preexistente em `docs/investigacao-producao-https-login.md`.

## Workflow follow-up

- Arquivar a change somente após revisão do conteúdo e validação estrita.
