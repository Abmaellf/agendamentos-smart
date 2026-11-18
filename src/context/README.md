# Contextos compartilhados

## Objetivo do módulo

Compartilhar somente estado de interface realmente transversal, sem armazenar
coleções remotas de domínio.

## Estado atual

- pacientes usam RTK Query dentro de `features/patients`;
- `App.tsx` não monta mais `PatientProvider`;
- `useGlobalContext.tsx` permanece como esqueleto legado de autenticação e deve
  ser concluído ou removido em change própria.

## Regras

- dados remotos de pacientes, profissionais, serviços e agendamentos pertencem
  aos adaptadores de API/cache;
- contexto não executa comandos de criação de domínio;
- contexto pode guardar estado visual transversal, como unidade ativa ou data,
  quando esse estado não for derivável da sessão/query;
- autorização e escopo de clínica/unidade continuam no backend.
