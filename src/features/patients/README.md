# Feature `patients`

## Objetivo

Concentrar a listagem paginada, filtros remotos, cadastro e apresentação de
pacientes. A rota pública da feature permanece `/paciente`.

## Estrutura

```text
patients/
├── api/
│   └── patients.ts
├── components/
│   ├── add-patient-modal.tsx
│   ├── pagination.tsx
│   ├── patient-status-badge.tsx
│   ├── patient-table-filter.tsx
│   └── patient-table-rows.tsx
├── model/
│   └── patient-errors.ts
├── pages/
│   └── patients-page.tsx
├── __tests__/
│   ├── patient-create.integration.test.tsx
│   └── patients-page.integration.test.tsx
└── README.md
```

## Fluxos

- listagem → `GET /patient/list` via RTK Query;
- filtros/paginação → parâmetros `name`, `status`, `serviceId`, `page`, `size`;
- cadastro → `POST /patient/save` com `name` e `unitIds`;
- sucesso de cadastro → invalidação de `PatientCatalog/LIST`;
- sessão/unidades/serviços → hooks de catálogo compartilhados com agenda.

## Regras de vínculo

- a clínica é derivada e autorizada pelo backend;
- `BASIC` usa exclusivamente `activeUnitId` da sessão;
- `ADMIN` escolhe uma ou mais unidades do catálogo autorizado;
- controles do frontend não substituem autorização do backend.

## Ausência de dados

`status` e `principalService` podem ser nulos enquanto o backend não tiver uma
fonte de domínio confiável. A tela apresenta `—` e nunca usa valores fixos.

## Limites atuais

Detalhe, edição e desativação permanecem desabilitados até existirem contratos
HTTP, autorização e testes próprios.
