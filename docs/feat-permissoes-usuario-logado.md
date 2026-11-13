# Alterações da branch `feat/permissoes-usuario-logado`

## 1. Contexto e escopo

Este documento registra as alterações presentes na branch `feat/permissoes-usuario-logado` para a regra de permissões baseada no usuário autenticado.

Os dois projetos envolvidos são:

- Frontend: `agendamento-smart-web/agendamentos-smart`
- API: `api-agendamento-smart-api/agendamento-smart-api`

Regra funcional implementada:

| Perfil | Escopo permitido |
| --- | --- |
| `ADMIN` | Todas as unidades da própria clínica |
| `USER` na API / `BASIC` no frontend | Somente a unidade associada ao usuário |
| Usuário anônimo | Não acessa listagens protegidas |

O frontend apenas representa essa regra na interface. A autorização definitiva está na API, que deriva o escopo do principal autenticado e não de um `unitId` arbitrário enviado pelo cliente.

## 2. Associação persistida entre usuário e unidade

Essa etapa é o pré-requisito para restringir as buscas. Antes, o cadastro posterior criava o usuário apenas com clínica; a unidade podia ser escolhida por fallback ou nem ser persistida.

### 2.1 DTO de cadastro

Antes, `RegisterDTO` não exigia a unidade:

```java
public record RegisterDTO(
        String login,
        String password,
        UserRole role,
        Boolean isProfessional,
        ProfessionalData professional
) {}
```

Depois, a unidade passou a ser obrigatória:

```java
public record RegisterDTO(
        @NotBlank @Size(max = 255) String login,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull UserRole role,
        @NotNull UUID unitId,
        @NotNull Boolean isProfessional,
        @Valid ProfessionalData professional
) {}
```

Arquivo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/dtos/user/RegisterDTO.java`

### 2.2 Cadastro protegido por ADMIN

Antes, qualquer usuário autorizado pela rota podia tentar cadastrar outro usuário e, quando necessário, o profissional era associado à `MATRIZ` encontrada pela clínica.

Depois, o service valida o papel, a clínica e a unidade:

```java
User principal = authenticatedUser(authentication);
if (principal.getRole() != UserRole.ADMIN) {
    throw new DomainException(
            "USER_REGISTRATION_FORBIDDEN",
            "Somente administradores podem cadastrar usuários.",
            HttpStatus.FORBIDDEN);
}

ClinicUnit unit = unitRepository
        .findByIdAndClinicId(request.unitId(), clinicId)
        .orElseThrow(DomainException::tenantResourceNotFound);

User user = User.builder()
        .login(login)
        .password(passwordEncoder.encode(request.password()))
        .role(UserRole.USER)
        .clinic(principal.getClinic())
        .clinicUnit(unit)
        .build();
```

Quando o usuário também é profissional, o profissional recebe a mesma unidade informada no cadastro:

```java
createProfessional(user, unit, request.professional());
```

Arquivo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/service/UserRegistrationService.java`

### 2.3 Onboarding inicial

As contas criadas durante o onboarding também passaram a receber explicitamente a unidade matriz:

```java
User user = User.builder()
        .login(login)
        .password(passwordEncoder.encode(data.password()))
        .role(role)
        .clinic(clinic)
        .clinicUnit(unit)
        .build();
```

Arquivo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/service/ClinicOnboardingService.java`

### 2.4 Validação no modelo

O vínculo deixou de ser opcional no modelo JPA e passou a validar a mesma clínica:

```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "clinic_unit_id", nullable = false)
private ClinicUnit clinicUnit;

@PrePersist
@PreUpdate
private void validateClinicUnit() {
    if (clinic != null && clinicUnit != null
            && !clinic.getId().equals(clinicUnit.getClinic().getId())) {
        throw new IllegalStateException(
                "A unidade do usuário deve pertencer à sua clínica");
    }
}
```

Arquivo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/model/user/User.java`

### 2.5 Perfil autenticado sem fallback arbitrário

Antes, `UserService` podia usar a primeira unidade da clínica quando o usuário não possuía uma unidade persistida:

```java
var unit = user.getClinicUnit() != null
        ? user.getClinicUnit()
        : unitRepository.findFirstByClinicIdOrderByNameAsc(...)
            .orElseThrow(...);
```

Depois, a unidade deve estar associada ao próprio usuário e pertencer à sua clínica:

```java
var unit = user.getClinicUnit();
if (unit == null || !unit.getClinic().getId().equals(user.getClinic().getId())) {
    throw new ResourceNotFoundException("Unidade ativa não encontrada");
}
```

Assim, `GET /auth/me` retorna a unidade persistida, e não uma unidade escolhida por ordem alfabética ou por parâmetro do cliente.

Arquivo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/service/UserService.java`

## 3. Resolvedor central de escopo

Antes, cada service consultava diretamente a clínica inteira, por exemplo:

```java
return unitRepository.findAllByClinicId(user.getClinic().getId());
```

Depois, foi criado `UnitScopeService`, que concentra a decisão de autorização:

```java
@Transactional(readOnly = true)
public List<ClinicUnit> allowedUnits(User user) {
    UUID clinicId = user.getClinic().getId();

    if (user.getRole() == UserRole.ADMIN) {
        return unitRepository.findAllByClinicId(clinicId);
    }

    if (user.getClinicUnit() == null) {
        throw DomainException.tenantResourceNotFound();
    }

    ClinicUnit unit = unitRepository
            .findByIdAndClinicId(user.getClinicUnit().getId(), clinicId)
            .orElseThrow(DomainException::tenantResourceNotFound);

    return List.of(unit);
}
```

O resolvedor também fornece:

```java
public boolean isAdmin(User user)
public UUID requireSingleAllowedUnitId(User user)
```

O segundo método garante que consultas de usuário não administrador não prossigam sem exatamente uma unidade autorizada.

Arquivo novo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/service/UnitScopeService.java`

## 4. Catálogos da API

### 4.1 Unidades

Antes, `/api/units` carregava todas as unidades da clínica:

```java
unitRepository.findAllByClinicId(user.getClinic().getId())
```

Depois, usa o resolvedor central:

```java
return unitScopeService.allowedUnits(user).stream()
        .map(unit -> new UnitOptionResponse(
                unit.getId(),
                unit.getName(),
                unit.getTenantId(),
                unit.getTimeZone()))
        .toList();
```

Resultado: `BASIC/USER` recebe uma unidade; `ADMIN` recebe as unidades da própria clínica.

### 4.2 Pacientes

Antes, o catálogo de pacientes filtrava apenas pela clínica:

```java
patientRepository.findAllByClinicId(clinicId)
```

Depois, `ADMIN` mantém o escopo da clínica e `USER` consulta diretamente a unidade autorizada:

```java
List<Patient> patients = unitScopeService.isAdmin(user)
        ? patientRepository.findAllByClinicId(clinicId)
        : patientRepository.findAllByClinicIdAndUnitId(
                clinicId,
                unitScopeService.requireSingleAllowedUnitId(user));
```

O filtro acontece no repositório antes do mapeamento para DTO:

```java
@Query("select distinct p from Patient p join p.units unit "
        + "where p.clinic.id = :clinicId and unit.id = :unitId")
List<Patient> findAllByClinicIdAndUnitId(
        @Param("clinicId") UUID clinicId,
        @Param("unitId") UUID unitId);
```

### 4.3 Profissionais

Antes, a busca por serviço retornava profissionais de qualquer unidade da clínica:

```java
professionalRepository
    .findDistinctByClinicIdAndServicesId(clinicId, service.getId())
```

Depois, `USER` usa a consulta com clínica, unidade e serviço:

```java
professionalRepository.findDistinctByClinicIdAndUnitIdAndServicesId(
        clinicId,
        unitScopeService.requireSingleAllowedUnitId(user),
        service.getId());
```

`ADMIN` continua usando a consulta ampla, mas limitada à própria clínica.

Arquivos principais:

- `api-agendamento-smart-api/src/main/java/com/agendamento/smart/service/CatalogService.java`
- `api-agendamento-smart-api/src/main/java/com/agendamento/smart/repository/PatientRepository.java`
- `api-agendamento-smart-api/src/main/java/com/agendamento/smart/repository/ProfessionalRepository.java`

### 4.4 Serviços

Serviços continuam limitados à clínica autenticada, porque o modelo atual não possui vínculo operacional serviço–unidade:

```java
serviceRepository.findAllByClinicId(user.getClinic().getId())
```

O `tenantId` retornado continua sendo derivado da unidade autorizada, e não de um valor arbitrário enviado pelo frontend.

## 5. Listagem de pacientes legada

`GET /patient/list` passou a usar o mesmo princípio de escopo:

- `ADMIN`: pacientes da própria clínica, com paginação.
- `USER`: pacientes vinculados à unidade persistida.
- Anônimo: acesso negado.
- Parâmetros como `unitId` não ampliam o escopo do usuário.

O service seleciona a consulta de acordo com o principal antes de montar a resposta paginada. Essa alteração evita que o endpoint legado permaneça como uma brecha de listagem global.

Arquivo: `api-agendamento-smart-api/src/main/java/com/agendamento/smart/service/PatientService.java`

## 6. Listagem e perfil de usuários

### 6.1 Antes

`GET /auth/list` permitia `ADMIN` e `USER` e serializava diretamente entidades `User`:

```java
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public ResponseEntity<List<User>> list() {
    return ResponseEntity.ok(userRepository.findAll());
}
```

Problemas:

- Lista global, sem clínica ou unidade.
- Usuário comum podia consultar usuários.
- Entidade JPA era usada diretamente na resposta.
- Havia risco de expor campos sensíveis.

### 6.2 Depois

Agora somente `ADMIN` consulta usuários:

```java
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<UserListResponse>> list(
        @RequestParam(required = false) UUID unitId,
        Authentication authentication) {
    User principal = (User) authentication.getPrincipal();

    List<User> users;
    if (unitId == null) {
        users = userRepository.findAllByClinicId(
                principal.getClinic().getId());
    } else {
        unitRepository.findByIdAndClinicId(
                unitId,
                principal.getClinic().getId())
            .orElseThrow(DomainException::tenantResourceNotFound);

        users = userRepository.findAllByClinicIdAndClinicUnitId(
                principal.getClinic().getId(), unitId);
    }

    return ResponseEntity.ok(
            users.stream().map(this::toListResponse).toList());
}
```

O DTO não contém senha nem hash:

```java
public record UserListResponse(
        UUID id,
        String login,
        UserRole role,
        UUID clinicId,
        UUID unitId,
        String unitName
) {}
```

Arquivos:

- `api-agendamento-smart-api/src/main/java/com/agendamento/smart/controller/auth/AuthenticationController.java`
- `api-agendamento-smart-api/src/main/java/com/agendamento/smart/model/user/dto/UserListResponse.java`
- `api-agendamento-smart-api/src/main/java/com/agendamento/smart/repository/UserRepository.java`

## 7. Alterações no frontend

### 7.1 Antes

O formulário começava sempre sem unidade selecionada:

```tsx
const emptyForm = (defaultDate = ''): AppointmentFormState => ({
  patientId: '',
  unitId: '',
  serviceId: '',
  // ...
})
```

O `SearchableSelect` de unidade era editável para qualquer perfil:

```tsx
<SearchableSelect
  options={unitOptions}
  value={form.unitId}
  onValueChange={(unitId) =>
    setForm((current) => ({ ...current, unitId }))
  }
/>
```

### 7.2 Depois: unidade derivada da sessão

O estado aceita uma unidade inicial:

```tsx
const emptyForm = (defaultDate = '', unitId = ''): AppointmentFormState => ({
  patientId: '',
  unitId,
  serviceId: '',
  // ...
})
```

O papel `BASIC` torna o controle somente leitura e verifica se a unidade da sessão está no catálogo retornado pela API:

```tsx
const unitIsReadOnly = session.user.role === 'BASIC'
const basicUnitUnavailable =
  unitIsReadOnly &&
  unitsQuery.isSuccess &&
  !unitsQuery.data.some((unit) => unit.id === session.activeUnitId)
```

Após o catálogo carregar, a unidade da sessão é selecionada:

```tsx
useEffect(() => {
  if (!open || !unitIsReadOnly || !unitsQuery.isSuccess) return

  const hasActiveUnit = unitsQuery.data.some(
    (unit) => unit.id === session.activeUnitId,
  )

  setForm((current) => ({
    ...current,
    unitId: hasActiveUnit ? session.activeUnitId : '',
  }))
}, [
  open,
  session.activeUnitId,
  unitIsReadOnly,
  unitsQuery.data,
  unitsQuery.isSuccess,
])
```

O controle agora bloqueia edição para `BASIC` e mantém edição para `ADMIN`:

```tsx
<SearchableSelect
  options={unitOptions}
  value={form.unitId}
  disabled={unitIsReadOnly || basicUnitUnavailable}
  onValueChange={(unitId) => {
    if (unitIsReadOnly) return
    setForm((current) => ({ ...current, unitId }))
  }}
/>
```

Se a sessão informar uma unidade que não veio no catálogo autorizado, o formulário mostra alerta e bloqueia a criação:

```tsx
{!catalogError && basicUnitUnavailable ? (
  <div role="alert">
    A unidade da sua sessão não está disponível para este atendimento.
  </div>
) : null}
```

Arquivo principal: `src/features/appointments/components/create-appointment-dialog.tsx`

### 7.3 Testes do frontend

Foram adicionados cenários em `src/features/appointments/__tests__/create-appointment-dialog.test.tsx` para verificar:

1. `BASIC` recebe a unidade ativa pré-selecionada.
2. O controle de unidade fica desabilitado para `BASIC`.
3. `ADMIN` continua podendo trocar de unidade.
4. O envio é bloqueado quando a unidade ativa não está no catálogo.
5. O preenchimento de um formulário válido continua funcionando para os dois perfis.

## 8. Teste integrado de evidência

O arquivo `api-agendamento-smart-api/src/test/java/com/agendamento/smart/BasicUnitScopeIntegrationTest.java` monta uma clínica com MATRIZ e FILIAL e verifica:

### Usuário BASIC/USER

- Recebe somente a FILIAL em `/api/units`.
- Recebe somente o paciente da FILIAL em `/api/patients`.
- Recebe o serviço da própria clínica.
- Recebe somente o profissional da FILIAL em `/api/professionals`.
- Continua limitado à FILIAL em `/patient/list`, mesmo enviando o `unitId` da MATRIZ.
- Recebe a unidade correta em `/auth/me`.
- Recebe `403` ao consultar `/auth/list`.
- Recebe `403` ao tentar cadastrar outro usuário.

### Usuário ADMIN

- Recebe as duas unidades.
- Recebe os dois pacientes.
- Recebe os profissionais das duas unidades.
- Consulta `/auth/list` com resposta segura, sem o campo `password`.

### Casos inválidos

O teste também confirma falha segura quando:

- o usuário não possui `clinicUnit`;
- a unidade associada pertence a outra clínica;
- um visitante tenta acessar a listagem legada de pacientes.

## 9. Documentação e OpenSpec

Foram atualizados os READMEs de autenticação, pacientes, services e frontend para registrar:

- escopo derivado da sessão;
- diferença entre `USER` na API e `BASIC` no frontend;
- ausência de autorização baseada somente no navegador;
- bloqueio da listagem global de usuários;
- unidade BASIC pré-selecionada e não editável.

Artefatos OpenSpec adicionados para a change `restringir-buscas-por-unidade-para-basics`:

- `proposal.md`
- `design.md`
- `specs/authentication-and-users/spec.md`
- `specs/clinic-catalog/spec.md`
- `specs/patients/spec.md`
- `tasks.md`

Validações executadas:

```text
Change 'restringir-buscas-por-unidade-para-basics' is valid
Change 'relacionar-usuarios-unidades-clinicas' is valid
```

As validações foram executadas nos dois repositórios com `--strict`.

## 10. Evidências de execução

### API

Comando executado:

```bash
./mvnw -q clean verify
```

Resultado: passou sem falhas. Entre os testes executados estão os cenários de escopo, cadastro de usuários, pacientes e agenda.

### Frontend

Comando direcionado:

```bash
npm run test -- \
  src/features/appointments/__tests__/create-appointment-dialog.test.tsx \
  src/features/session/__tests__/session-contract.test.ts \
  --reporter=dot
```

Resultado: 2 arquivos e 37 testes aprovados.

`npm run lint` e `npm run build` continuam apresentando falhas legadas em componentes/testes antigos, sem erro relacionado aos arquivos alterados desta regra. Os pontos registrados são:

- `src/components/__tests__/app-sidebar.test.tsx`;
- `src/components/Card/CardDay/index.tsx`;
- `src/components/__tests__/legacy-calendar-components.test.tsx`.

## 11. Pendências e limites conhecidos

1. A migration existente `V011__add_user_clinic_unit.sql` foi usada pela integração, mas o hardening idempotente dessa migration permanece como tarefa pendente da change predecessora.
2. As changes OpenSpec foram validadas, mas não foram arquivadas.
3. Não foi feito commit, push ou deploy.
4. A linha preexistente `Openspec Apply Change.` no campo de data do diálogo foi preservada e não faz parte da regra de permissões.

## 12. Resultado final

O comportamento passou de uma busca ampla baseada na clínica para um escopo efetivo derivado do usuário autenticado:

```text
principal autenticado
        |
        v
UserRole + clinicUnit persistidos
        |
        v
UnitScopeService
        |
        +--> ADMIN: todas as unidades da clínica
        |
        +--> USER/BASIC: somente clinicUnit
        |
        v
catálogos, pacientes, profissionais, usuários e agenda
        |
        v
respostas sem dados fora da unidade autorizada
```
