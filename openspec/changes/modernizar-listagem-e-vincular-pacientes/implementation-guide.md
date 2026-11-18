# Guia de implementação: listagem e cadastro de pacientes

## 1. Objetivo deste documento

Este documento transforma a change `modernizar-listagem-e-vincular-pacientes` em um roteiro técnico executável. Ele explica:

- o comportamento atual observado no frontend e no backend;
- por que o cadastro falha hoje;
- quais contratos HTTP precisam existir;
- quais arquivos devem ser modificados;
- como cada alteração deve funcionar teoricamente;
- exemplos do código atual e do código-alvo;
- testes, documentação e verificações necessários para considerar a entrega concluída.

Este arquivo é um guia de implementação e não altera código de produção. A implementação deve seguir a [spec delta](specs/legacy-patient-management/spec.md), a [proposta](proposal.md), o [design](design.md) e as tarefas em [tasks.md](tasks.md).

## 2. Escopo e dependências

### 2.1 Escopo incluído

A entrega deve cobrir:

1. autorização de criação para `ADMIN` e `USER` no backend;
2. associação obrigatória do paciente à clínica autenticada e a uma ou mais unidades válidas;
3. limitação do usuário `USER`/`BASIC` à sua unidade ativa;
4. remoção do fluxo legado `POST patients`;
5. uso exclusivo de `POST /patient/save`;
6. listagem paginada e escopada;
7. filtros que tenham contrato real;
8. estados de carregamento, erro e vazio;
9. modernização visual da rota `/paciente` conforme a imagem de referência;
10. testes de API, frontend, contrato, lint e build;
11. atualização dos READMEs que descrevem os contratos.

### 2.2 Dependência de sessão

A change `relacionar-usuarios-unidades-clinicas` define a associação do usuário `USER` a uma `clinic_unit` e fornece `activeUnitId` no perfil. Antes de ativar o cadastro para `BASIC`, essa associação precisa existir no ambiente executado.

O frontend utiliza o vocabulário `BASIC`, mas o enum atual do backend usa `USER`. A conversão já acontece em `UserService.getUserProfile`, que retorna `BASIC` para um usuário persistido como `USER`. Não criar um novo papel no banco apenas para esta tela.

### 2.3 Fora de escopo

Não devem ser inventados nesta entrega:

- prontuário, CPF, telefone ou dados clínicos não presentes no contrato;
- edição real do paciente;
- inativação real do paciente;
- detalhe clínico;
- seleção de unidade para `BASIC`;
- status “Em atendimento” calculado artificialmente;
- serviço principal preenchido com texto fixo;
- alteração destrutiva de dados ou migration que remova vínculos existentes.

Os botões de editar, desativar e detalhe só podem ser ativos se seus endpoints e regras de domínio também forem implementados. Caso contrário, devem ser desabilitados, ocultados ou apresentados como indisponíveis.

## 3. Diagnóstico completo do estado atual

### 3.1 Fluxo atual do frontend

Hoje a rota `/paciente` é montada pelo `Router` dentro do `AppLayout`:

```tsx
// src/Router.tsx — estado atual
<Route element={<AppLayout />}>
  <Route path="/paciente" element={<Patient />} />
</Route>
```

`App` monta um `PatientProvider` global mesmo quando a rota atual não é de pacientes:

```tsx
// src/App.tsx — estado atual
<PatientProvider>
  <BrowserRouter>
    {/* ... */}
    <Provider store={store}>
      <Router />
    </Provider>
  </BrowserRouter>
</PatientProvider>
```

Na página, o fluxo atual é:

```text
/paciente
  └── Patient
      ├── PatientContext.patients
      ├── useEffect → PatientContext.fetchPatients()
      │              └── GET /patient/list
      ├── PatientTableFilter
      ├── AddPatientModal
      │   └── RTK Query → POST /patient/save
      └── CreatePatientDialog
          └── PatientContext.createPatient()
              └── POST patients
```

O problema é que há dois fluxos de criação montados no mesmo contexto visual. Um chama o endpoint correto, porém envia um payload incompleto. O outro chama um endpoint legado plural que não existe no controller atual.

### 3.2 Cadastro atual do modal RTK Query

O tipo aceito pelo frontend contém somente o nome:

```ts
// src/@types/patient.ts — estado atual
export interface CreatePatientInput {
  name: string
}
```

O modal também valida somente o nome:

```tsx
// src/features/patients/components/add-patient-modal.tsx — estado atual
const createPatientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})
```

E envia:

```tsx
// src/features/patients/components/add-patient-modal.tsx — estado atual
await addPatient({
  name: data.name,
}).unwrap()
```

Mesmo que a pessoa esteja autenticada como `ADMIN`, o backend atual recebe um JSON sem `unitIds` e falha na validação.

### 3.3 Fluxo legado incompatível

`PatientContext` chama a rota plural:

```tsx
// src/features/patients/model/patient-context.tsx — estado atual
const response = await api.post('patients', {
  uuid,
  name,
  empresa: 'Equilibrio',
  createdAt: new Date(),
  status: 'Ativo',
})
```

Esse código tem quatro problemas independentes:

1. o controller atual está em `/patient`, não `/patients`;
2. não existe `POST /patients` no backend analisado;
3. `uuid` foi importado de `zod`, não é um identificador gerado para o paciente;
4. `empresa`, `createdAt` e `status` não fazem parte do `PatientRequestDTO` atual.

Esse fluxo deve ser removido do caminho executável da tela, não adaptado parcialmente.

### 3.4 Listagem atual do frontend

O componente de linha usa dados fixos:

```tsx
// src/features/patients/components/patient-table-rows.tsx — estado atual
<TableCell className="font-medium">0001</TableCell>
<TableCell className="font-medium">{patientObj.name}</TableCell>

<TableCell>
  <div className="flex items-center gap-2">
    <span className="h-2 w-2 rounded-full bg-slate-400" />
  </div>
</TableCell>

<TableCell className="text-muted-foreground">21/10/2025</TableCell>
```

Logo, o código, o status e a data não representam o paciente retornado pela API. O tipo usado pela linha também contém somente `name`:

```ts
// src/@types/patient.ts — estado atual
export interface PatientTableRowsProps {
  patientObj: {
    name: string
  }
}
```

A página também fixa a paginação:

```tsx
// src/features/patients/pages/patients-page.tsx — estado atual
<Pagination pageIndex={0} totalCount={10} perPage={10} />
```

O total real, a página corrente, o tamanho e o último resultado da API são ignorados.

### 3.5 Filtro atual

O filtro apenas repete a consulta sem usar o texto informado:

```tsx
// src/features/patients/components/patient-table-filter.tsx — estado atual
async function handleSearchPatient(data: PatientTableFilterFormValues) {
  await fetchPatients()
  console.log(data)
}
```

Isso significa que a interface aparenta filtrar, mas a API recebe a mesma requisição sem nome, status ou serviço.

### 3.6 Paginação atual

Os botões são apenas visuais. Não têm `onClick`, não sabem se estão na primeira/última página e não mudam a consulta:

```tsx
// src/features/patients/components/pagination.tsx — estado atual
<Button variant="outline" className="h-8 w-8 p-0">
  <ChevronLeft className="h-4 w-4" />
  <span className="sr-only">Primeira página</span>
</Button>
```

O componente calcula a quantidade de páginas corretamente apenas a partir dos props, mas a página sempre fornece valores fixos.

### 3.7 Ações sem domínio

Os botões de editar e desativar não têm callbacks:

```tsx
// src/features/patients/components/patient-table-rows.tsx — estado atual
<Button variant="outline" size="xs">
  <ArrowRight className="mr-2 h-3 w-3" />
  Editar
</Button>

<Button variant="ghost" size="xs">
  <X className="mr-2 h-3 w-3" />
  Desativar
</Button>
```

Eles não podem ser apresentados como operações concluídas. A modernização visual pode manter a presença deles apenas como controles indisponíveis, com rótulo acessível, ou removê-los até haver contrato.

## 4. Diagnóstico completo do backend

### 4.1 O modelo já exige clínica e unidade

O modelo `Patient` já possui os dois vínculos relevantes:

```java
// Patient.java — estado atual
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "clinic_id", nullable = false)
private Clinic clinic;

@ManyToMany(fetch = FetchType.LAZY)
@JoinTable(
        name = "PATIENT_UNIT",
        joinColumns = @JoinColumn(name = "patient_id"),
        inverseJoinColumns = @JoinColumn(name = "unit_id")
)
private Set<ClinicUnit> units = new LinkedHashSet<>();
```

A tabela `PATIENT` possui `clinic_id NOT NULL`. A migration `V010__add_clinic_structure_and_unit_links.sql` cria `PATIENT_UNIT` e um trigger que rejeita vínculo de paciente e unidade pertencentes a clínicas diferentes.

Portanto, o problema não é a ausência de suporte no banco. O problema está no contrato entre a tela e a API, na autorização do controller e na falta de validação específica da unidade do usuário `USER` durante a criação.

### 4.2 A API exige `unitIds`

O request atual é:

```java
// PatientRequestDTO.java — estado atual
public record PatientRequestDTO(
        @NotBlank @Size(max = 255) String name,
        UUID clinicId,
        @NotEmpty List<@NotNull UUID> unitIds
) {
}
```

Consequências:

- `{ "name": "Beatriz" }` falha com `VALIDATION_ERROR`;
- `unitIds: []` falha com `VALIDATION_ERROR`;
- `unitIds` com um ID de outra clínica chega ao service e falha com `TENANT_RESOURCE_NOT_FOUND`;
- `clinicId` é opcional no formato, mas, quando enviado, precisa ser igual à clínica do principal;
- a clínica efetiva não deve ser escolhida pelo navegador.

### 4.3 A autorização atual bloqueia a recepção

O controller atual contém:

```java
// PatientController.java — estado atual
@PostMapping("/save")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<PatientResponseDTO> savePatient(
        @RequestBody @Valid PatientRequestDTO dto,
        Authentication authentication
) {
    PatientResponseDTO response = patientService.save(dto, authentication);
    return ResponseEntity.ok(response);
}
```

O seed de desenvolvimento registra `recepcao@agendasmart.com` como `USER`. A documentação do módulo declara que `ADMIN` e `BASIC` podem cadastrar pacientes, mas a anotação acima permite somente `ADMIN`.

O código-alvo deve ser:

```java
// PatientController.java — alvo
@PostMapping("/save")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public ResponseEntity<PatientResponseDTO> savePatient(
        @RequestBody @Valid PatientRequestDTO dto,
        Authentication authentication
) {
    PatientResponseDTO response = patientService.save(dto, authentication);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

O status `201 Created` é recomendado para criação, mas precisa ser adotado em conjunto com o frontend e os testes. Se a compatibilidade do cliente exigir `200` temporariamente, manter `200` durante a transição e registrar a decisão no contrato; não alterar silenciosamente.

### 4.4 O service já deriva a clínica, mas ainda não limita o `USER` na criação

A parte atual de escopo é:

```java
// PatientService.java — estado atual
User principal = authenticatedUser(authentication);
UUID clinicId = principal.getClinic().getId();

if (dto.clinicId() != null && !dto.clinicId().equals(clinicId)) {
    throw new DomainException(
            "CLINIC_ACCESS_DENIED",
            "O clinicId informado não corresponde à clínica autenticada.",
            HttpStatus.FORBIDDEN);
}

Clinic clinic = clinicRepository.findById(clinicId)
        .orElseThrow(DomainException::tenantResourceNotFound);

LinkedHashSet<UUID> requestedUnitIds = new LinkedHashSet<>(dto.unitIds());
List<ClinicUnit> units = unitRepository.findAllByClinicIdAndIdIn(
        clinicId,
        requestedUnitIds);

if (units.size() != requestedUnitIds.size()) {
    throw DomainException.tenantResourceNotFound();
}
```

Esse código já impede unidade de outra clínica, mas para um usuário `USER` ele ainda aceita qualquer unidade da própria clínica enviada no payload. O código-alvo deve acrescentar a validação de escopo efetivo.

#### Método novo: `validateClinicId`

`validateClinicId` **não existe atualmente** no `PatientService`. Ele deve ser criado como um método privado de apoio dentro de:

```text
api-agendamento-smart-api/agendamento-smart-api/
└── src/main/java/com/agendamento/smart/service/PatientService.java
```

Sua responsabilidade é validar o campo legado/opcional `clinicId` recebido no JSON. Esse campo não define o tenant do cadastro; ele serve apenas para compatibilidade. A clínica verdadeira deve sempre vir de `principal.getClinic().getId()`.

Implementação esperada:

```java
private void validateClinicId(UUID requestedClinicId, UUID authenticatedClinicId) {
    if (requestedClinicId != null
            && !requestedClinicId.equals(authenticatedClinicId)) {
        throw new DomainException(
                "CLINIC_ACCESS_DENIED",
                "O clinicId informado não corresponde à clínica autenticada.",
                HttpStatus.FORBIDDEN);
    }
}
```

O método deve ser chamado antes de buscar a clínica e as unidades:

```java
User principal = authenticatedUser(authentication);
UUID clinicId = principal.getClinic().getId();

validateClinicId(dto.clinicId(), clinicId);

Clinic clinic = clinicRepository.findById(clinicId)
        .orElseThrow(DomainException::tenantResourceNotFound);
```

Explicação teórica:

- `requestedClinicId`: valor controlado pelo cliente; pode ser `null`;
- `authenticatedClinicId`: valor derivado do usuário autenticado; é a fonte confiável;
- quando o valor enviado é `null`, a validação passa e o service usa a clínica autenticada;
- quando os dois IDs são iguais, a validação passa;
- quando são diferentes, a operação termina com `403 CLINIC_ACCESS_DENIED`;
- o método não busca dados no banco e não altera entidades;
- o método não deve ser usado para escolher a clínica, apenas para rejeitar divergência.

O objetivo é impedir que o frontend tente cadastrar um paciente em outra clínica enviando um `clinicId` arbitrário. A autorização continua sendo responsabilidade do backend.

Depois de criar esse método, o código-alvo completo do início do cadastro fica:

```java
// PatientService.java — alvo após adicionar validateClinicId
User principal = authenticatedUser(authentication);
UUID clinicId = principal.getClinic().getId();
LinkedHashSet<UUID> requestedUnitIds = new LinkedHashSet<>(dto.unitIds());

validateClinicId(dto.clinicId(), clinicId);

if (!unitScopeService.isAdmin(principal)) {
    UUID activeUnitId = unitScopeService.requireSingleAllowedUnitId(principal);

    if (!requestedUnitIds.equals(new LinkedHashSet<>(List.of(activeUnitId)))) {
        throw new DomainException(
                "UNIT_ACCESS_DENIED",
                "O usuário só pode cadastrar pacientes na unidade associada.",
                HttpStatus.FORBIDDEN);
    }
}

Clinic clinic = clinicRepository.findById(clinicId)
        .orElseThrow(DomainException::tenantResourceNotFound);

List<ClinicUnit> units = unitRepository.findAllByClinicIdAndIdIn(
        clinicId,
        requestedUnitIds);

if (units.size() != requestedUnitIds.size()) {
    throw DomainException.tenantResourceNotFound();
}
```

A implementação final deve comparar conjuntos, não listas, para evitar que a ordem do JSON seja usada como regra de autorização. Duplicidades também devem ser eliminadas antes da comparação, como o `LinkedHashSet` já faz.

### 4.5 O service já persiste a associação correta

Depois da validação, o código atual faz o vínculo correto:

```java
// PatientService.java — trecho já adequado
patient.setName(namePatient);
patient.setClinic(clinic);
patient.setUnits(new LinkedHashSet<>(units));

patient = patientRepository.saveAndFlush(patient);
```

Esse trecho deve ser preservado. Não aceitar `clinicId` ou objetos `ClinicUnit` completos enviados pelo cliente como autoridade. O cliente envia somente identificadores; o service resolve as entidades dentro do tenant autenticado.

### 4.6 A consulta de listagem já aplica escopo por papel

O método atual faz:

```java
// PatientService.java — estado atual
var pageEntity = unitScopeService.isAdmin(user)
        ? patientRepository.findAllByClinicId(user.getClinic().getId(), pageable)
        : patientRepository.findAllByClinicIdAndUnits_Id(
                user.getClinic().getId(),
                unitScopeService.requireSingleAllowedUnitId(user),
                pageable);
```

Essa regra deve permanecer. O frontend não deve filtrar dados para simular autorização. Se forem adicionados parâmetros de nome, status ou serviço, eles devem ser combinados com a condição de clínica/unidade no repository.

### 4.7 Resposta atual não contém tudo que a imagem mostra

O response atual é mínimo:

```java
// PatientResponseDTO.java — estado atual
public record PatientResponseDTO(
        UUID id,
        String name,
        UUID clinicId,
        List<UUID> unitIds
) {
}
```

O mapper não expõe `code` nem `createdAt`:

```java
// PatientMapper.java — estado atual
return new PatientResponseDTO(
        entity.getId(),
        entity.getName(),
        entity.getClinic().getId(),
        entity.getUnits().stream()
                .map(ClinicUnit::getId)
        .sorted()
        .toList());
```

#### Novo DTO: `PrincipalServiceResponse`

`PrincipalServiceResponse` **também não existe atualmente** no backend. Ele deve ser criado somente se a API realmente passar a fornecer o serviço principal do paciente. A recomendação é criar um record separado no pacote de DTOs de paciente:

```text
src/main/java/com/agendamento/smart/dtos/patient/PrincipalServiceResponse.java
```

Código-alvo:

```java
package com.agendamento.smart.dtos.patient;

import java.util.UUID;

public record PrincipalServiceResponse(
        UUID id,
        String name
) {
}
```

Responsabilidade teórica do record:

- representar somente a projeção pública do serviço principal;
- expor o ID e o nome necessários à listagem;
- não carregar a entidade JPA `ServiceOffering` para fora do domínio;
- não conter preço, duração ou capacidade se a listagem não precisar desses dados;
- permitir que `PatientResponseDTO` retorne `null` quando não houver serviço principal definido.

O `PatientResponseDTO` deve importar esse tipo:

```java
package com.agendamento.smart.dtos.patient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PatientResponseDTO(
        UUID id,
        Long code,
        String name,
        UUID clinicId,
        List<UUID> unitIds,
        LocalDateTime createdAt,
        String status,
        PrincipalServiceResponse principalService
) {
}
```

Como os dois records estão no mesmo pacote, nenhum import adicional é necessário para `PrincipalServiceResponse`. Se a equipe optar por colocá-lo em outro pacote, o import deverá ser explícito e a decisão precisa ser refletida no README de DTOs.

Importante: criar o record não cria automaticamente o serviço principal. O mapper/service ainda precisará de uma fonte confiável para preenchê-lo. Enquanto essa fonte não existir, o retorno correto é `principalService = null`.

O mapper não deve consultar a API, acessar o contexto de segurança ou escolher um serviço por nome. Sua responsabilidade é transformar dados já resolvidos pelo domínio em DTOs. Por isso, o service pode fornecer `status` e `PrincipalServiceResponse` como argumentos opcionais quando essas informações existirem.

#### Interface `PatientMapper` completa — código-alvo

Hoje a interface existente possui somente o mapeamento básico da entidade e devolve um `PatientResponseDTO` antigo. Depois da alteração do response, a interface completa deve ficar conceitualmente assim:

```java
package com.agendamento.smart.mapper;

import com.agendamento.smart.dtos.patient.PatientRequestDTO;
import com.agendamento.smart.dtos.patient.PatientResponseDTO;
import com.agendamento.smart.dtos.patient.PrincipalServiceResponse;
import com.agendamento.smart.model.patient.Patient;
import com.agendamento.smart.model.unit.ClinicUnit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface PatientMapper {

    /**
     * Converte o request em entidade sem confiar nos relacionamentos enviados
     * pelo cliente. Clínica e unidades são resolvidas pelo PatientService.
     */
    @Mapping(target = "clinic", ignore = true)
    @Mapping(target = "units", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Patient toEntity(PatientRequestDTO dto);

    /**
     * Mapeamento usado quando status e serviço principal não foram resolvidos.
     * O retorno é seguro para a listagem porque não inventa informações.
     */
    default PatientResponseDTO toDto(Patient entity) {
        return toDto(entity, null, null);
    }

    /**
     * Mapeamento completo. O service deve fornecer status e serviço principal
     * somente quando existir uma fonte confiável para esses dados.
     */
    default PatientResponseDTO toDto(
            Patient entity,
            String status,
            PrincipalServiceResponse principalService) {
        if (entity == null) {
            return null;
        }

        UUID clinicId = entity.getClinic() == null
                ? null
                : entity.getClinic().getId();

        return new PatientResponseDTO(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                clinicId,
                unitIds(entity),
                entity.getCreatedAt(),
                status,
                principalService
        );
    }

    /**
     * Converte as unidades associadas para IDs estáveis e determinísticos.
     * A ordenação evita respostas diferentes apenas pela ordem do Set.
     */
    default List<UUID> unitIds(Patient entity) {
        if (entity.getUnits() == null) {
            return List.of();
        }

        return entity.getUnits().stream()
                .map(ClinicUnit::getId)
                .sorted()
                .toList();
    }
}
```

O uso normal, enquanto ainda não houver fonte para serviço principal, será:

```java
PatientResponseDTO response = patientMapper.toDto(patient);
```

Quando o service tiver resolvido os dados de forma confiável, poderá usar:

```java
PrincipalServiceResponse principalService = serviceResolver
        .findPrincipalService(patient)
        .orElse(null);

PatientResponseDTO response = patientMapper.toDto(
        patient,
        resolvedStatus,
        principalService);
```

`serviceResolver` representa uma dependência de domínio que ainda não existe no código atual. Ele não deve ser criado apenas para preencher a imagem; primeiro é necessário definir como o serviço principal será escolhido — por exemplo, pelo último atendimento, pelo serviço mais frequente ou por uma relação explícita.

Não preencher `principalService` com um serviço fixo apenas para reproduzir a imagem.

A entidade possui `code` e `createdAt`, portanto esses campos podem ser adicionados sem criar valores fictícios:

```java
// PatientResponseDTO.java — alvo mínimo
public record PatientResponseDTO(
        UUID id,
        Long code,
        String name,
        UUID clinicId,
        List<UUID> unitIds,
        LocalDateTime createdAt,
        String status,
        PrincipalServiceResponse principalService
) {
}
```

O exemplo acima é um contrato-alvo e exige duas decisões de domínio:

1. `status` não existe hoje em `Patient`; não adicionar `ATIVO`, `INATIVO` ou `EM_ATENDIMENTO` apenas para colorir a tela sem uma regra aprovada;
2. `principalService` também não existe como relação direta em `Patient`; pode ser derivado de atendimento/serviço, mas a origem precisa ser confiável.

Até a origem desses campos existir, o backend deve retornar ausência explícita e o frontend deve renderizar `—`, não `Ativo`, `Pilates` ou uma data fixa.

### 4.8 Paginação já possui metadados suficientes

`PageResponseDTO` já retorna:

```java
// PageResponseDTO.java — estado atual
public record PageResponseDTO<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}
```

O backend não precisa criar um segundo formato de paginação. A tela deve consumir esses campos. O `Pageable` do controller também já é aceito:

```java
// PatientController.java — estado atual
@GetMapping("/list")
public ResponseEntity<PageResponseDTO<PatientResponseDTO>> findAllPatient(
        Pageable pageable,
        Authentication authentication) {
    PageResponseDTO<PatientResponseDTO> patientResponseDTO =
            patientService.findAllPatient(pageable, authentication);
    return ResponseEntity.ok().body(patientResponseDTO);
}
```

### 4.9 Erros já possuem contrato parcial

O handler já mapeia:

- `VALIDATION_ERROR` para campos inválidos;
- `CLINIC_ACCESS_DENIED` e outros `DomainException` para o status configurado;
- `TENANT_RESOURCE_NOT_FOUND` para 404;
- `PATIENT_ALREADY_EXISTS` para 409.

O novo erro `UNIT_ACCESS_DENIED` deve usar o mesmo `ApiErrorResponse` e receber uma mensagem segura. Não devolver nomes, IDs ou dados da clínica estrangeira.

## 5. Contratos HTTP desejados

### 5.1 `POST /patient/save`

#### Request atual enviado pelo frontend

```json
{
  "name": "Beatriz"
}
```

Esse request é insuficiente.

#### Request-alvo para `BASIC`

```json
{
  "name": "Beatriz",
  "unitIds": ["<active-unit-id>"]
}
```

O frontend não precisa enviar `clinicId`; o backend deve derivá-lo do usuário autenticado. Se o campo legado for enviado, o backend deve rejeitar divergência.

#### Request-alvo para `ADMIN`

```json
{
  "name": "Beatriz",
  "unitIds": ["<unit-id-1>", "<unit-id-2>"]
}
```

Os IDs precisam vir do catálogo autorizado da clínica do administrador.

#### Resposta de sucesso

O response deve retornar o paciente persistido, incluindo no mínimo `id`, `name`, `clinicId` e `unitIds`. Para a listagem visual, `code` e `createdAt` devem ser retornados quando já existirem no domínio. `status` e `principalService` só devem ser enviados se houver origem definida.

#### Matriz de erro

| Situação | HTTP esperado | Código | Comportamento do frontend |
| --- | ---: | --- | --- |
| Nome vazio ou `unitIds` ausente/vazio | 400 | `VALIDATION_ERROR` | Mostrar erro nos campos e manter formulário |
| `clinicId` divergente | 403 | `CLINIC_ACCESS_DENIED` | Informar que a clínica não pertence à sessão |
| Unidade de outra clínica | 404 | `TENANT_RESOURCE_NOT_FOUND` | Informar unidade não disponível sem expor dados |
| `BASIC` envia unidade diferente da ativa | 403 | `UNIT_ACCESS_DENIED` | Bloquear/mostrar erro de escopo |
| Nome duplicado | 409 | `PATIENT_ALREADY_EXISTS` | Informar duplicidade e preservar dados |
| Sem permissão | 403 | resposta de segurança | Informar que a conta não pode cadastrar |
| Falha de rede | — | `FETCH_ERROR` | Exibir erro recuperável |

### 5.2 `GET /patient/list`

#### Request atual

```text
GET /patient/list
```

#### Request-alvo com paginação

```text
GET /patient/list?page=0&size=10
```

#### Request-alvo com filtros, somente após contrato implementado

```text
GET /patient/list?page=0&size=10&name=Ana&status=ATIVO&serviceId=<id>
```

Os nomes dos parâmetros precisam ser definidos em conjunto entre controller, service, repository, MSW e frontend. Não criar controles de filtro que não tenham efeito real.

#### Resposta paginada

```json
{
  "content": [
    {
      "id": "<patient-id>",
      "code": 5001,
      "name": "ANA OLIVEIRA",
      "clinicId": "<clinic-id>",
      "unitIds": ["<unit-id>"],
      "createdAt": "2025-10-21T12:00:00Z",
      "status": "ATIVO",
      "principalService": null
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

O exemplo é ilustrativo. A implementação não deve fabricar `status` ou `principalService` se o backend ainda não possuir essa informação.

## 6. Implementação do backend, passo a passo

### Passo 1 — Confirmar o contrato de papel

Modificar:

- `src/main/java/com/agendamento/smart/controller/patient/PatientController.java`;
- `src/main/java/com/agendamento/smart/controller/patient/README.md`;
- testes de integração do controller.

Alterar `hasRole('ADMIN')` para aceitar `ADMIN` e `USER`, desde que a regra de escopo do service esteja pronta na mesma entrega. Não liberar a rota antes de implementar a limitação de unidade.

Verificar:

- `ADMIN` cria paciente em uma unidade da própria clínica;
- `USER` cria paciente na unidade associada;
- pessoa não autenticada não cria;
- unidade de outra clínica não cria;
- `USER` não amplia o escopo enviando outra unidade.

### Passo 2 — Manter o request orientado a IDs

Modificar apenas se necessário:

- `src/main/java/com/agendamento/smart/dtos/patient/PatientRequestDTO.java`;
- README de DTO de paciente;
- testes de validação.

O formato recomendado permanece:

```java
public record PatientRequestDTO(
        @NotBlank @Size(max = 255) String name,
        UUID clinicId,
        @NotEmpty List<@NotNull UUID> unitIds
) {}
```

Não trocar `unitIds` por objetos completos de unidade. O cliente pode enviar IDs, mas somente o backend resolve e verifica as entidades.

### Passo 3 — Fortalecer o escopo no service

Modificar:

- `src/main/java/com/agendamento/smart/service/PatientService.java`;
- possivelmente `src/main/java/com/agendamento/smart/service/UnitScopeService.java` se for necessário expor uma operação de validação sem duplicar regras;
- testes de integração de cadastro.

Adicionar no `PatientService` o método privado `validateClinicId(UUID requestedClinicId, UUID authenticatedClinicId)` descrito na seção 4.4. Não procurar esse método em outro arquivo: ele é uma nova função auxiliar do service e não existe no código atual.

Algoritmo obrigatório:

1. obter o principal autenticado;
2. obter `clinicId` do principal;
3. chamar `validateClinicId` e rejeitar `clinicId` informado quando divergente;
4. exigir `unitIds` não vazio;
5. resolver unidades por `clinicId` e IDs;
6. para `USER`, exigir exatamente a unidade retornada por `requireSingleAllowedUnitId`;
7. para `ADMIN`, permitir qualquer conjunto retornado pela própria clínica;
8. normalizar o nome;
9. verificar duplicidade conforme a regra existente;
10. associar clínica e unidades resolvidas;
11. persistir em transação;
12. mapear a entidade para resposta.

Não usar `activeUnitId` enviado pelo browser como prova de autorização. O `activeUnitId` ajuda a tela, mas a autoridade é o principal autenticado no backend.

### Passo 4 — Decidir e implementar os campos da resposta

Modificar:

- `src/main/java/com/agendamento/smart/dtos/patient/PatientResponseDTO.java`;
- `src/main/java/com/agendamento/smart/dtos/patient/PrincipalServiceResponse.java` — novo record, caso o campo seja mantido no contrato;
- `src/main/java/com/agendamento/smart/mapper/PatientMapper.java`;
- `src/main/java/com/agendamento/smart/model/patient/Patient.java` apenas se existir decisão de domínio para status;
- repositórios relacionados se o serviço principal for derivado;
- testes de contrato.

#### Campos que já têm origem

- `id`: entidade `Patient`;
- `code`: entidade `Patient`, preenchida pelo `CodeGeneratorListener`;
- `name`: entidade `Patient`;
- `clinicId`: entidade `Patient.clinic`;
- `unitIds`: entidade `Patient.units`;
- `createdAt`: entidade `Patient.createdAt`.

#### Campos que não têm origem atual

- status do paciente;
- serviço principal.

Para esses dois campos, seguir uma destas decisões documentadas antes de codificar:

- retornar `null`/ausente e exibir `—` no frontend;
- criar uma mudança de domínio específica que modele o status;
- criar consulta derivada aprovada para serviço e atendimento atual.

Não usar `status: 'Ativo'` nem `serviceName: 'Pilates'` como valor visual fixo.

### Passo 5 — Implementar filtros no backend somente se forem reais

Modificar, se os filtros forem parte da entrega funcional:

- `PatientController.java` para receber parâmetros;
- `PatientService.java` para transportar os filtros;
- `PatientRepository.java` ou uma especificação de consulta;
- testes de isolamento e filtros.

A consulta precisa combinar o filtro com o tenant:

```java
// Exemplo conceitual; adaptar ao contrato final
@Query("""
    select distinct p
    from Patient p
    left join p.units unit
    where p.clinic.id = :clinicId
      and (:unitId is null or unit.id = :unitId)
      and (:name is null or upper(p.name) like upper(concat('%', :name, '%')))
    """)
Page<Patient> searchByClinicAndFilters(
        UUID clinicId,
        UUID unitId,
        String name,
        Pageable pageable);
```

Para `USER`, o `unitId` efetivo deve vir do principal, mesmo que o cliente tente enviar outro. Para `ADMIN`, filtros de unidade precisam ser validados contra a clínica antes de consultar.

Status e serviço não devem ser adicionados à query até que sua origem esteja definida.

### Passo 6 — Preservar a integridade do banco

Verificar, sem remover:

- `PATIENT.clinic_id NOT NULL` em `V003__create_table_patient.sql`;
- tabela `PATIENT_UNIT` em `V010__add_clinic_structure_and_unit_links.sql`;
- trigger `enforce_patient_unit_same_clinic`;
- preenchimento de pacientes existentes em `R__009_seed_patient_unit.sql`.

Não criar uma migration para apagar e recriar vínculos. Se a entidade receber um novo status, criar migration versionada e cobrir dados existentes antes de usá-lo na tela.

### Passo 7 — Atualizar o tratamento de erros

Modificar, se necessário:

- `ApiExceptionHandler.java`;
- `ApiErrorResponse.java`;
- testes dos códigos HTTP.

O contrato deve manter códigos estáveis e mensagens sem dados sensíveis. A exceção de unidade fora do escopo pode reutilizar `TENANT_RESOURCE_NOT_FOUND` para não revelar a existência de uma unidade estrangeira, ou usar `UNIT_ACCESS_DENIED` quando a regra exigir diferenciação. A escolha deve ser uniforme nos testes e no frontend.

### Passo 8 — Cobrir o backend com integração

Modificar:

- `PatientRegistrationControllerIntegrationTest.java`;
- `BasicUnitScopeIntegrationTest.java`;
- criar teste específico se a cobertura ficar excessivamente ampla.

Casos mínimos:

```text
ADMIN + nome + unidade própria       → sucesso
USER + nome + unidade associada      → sucesso
USER + unidade própria diferente     → 403/erro de escopo
ADMIN + unidade de outra clínica     → 404/erro de tenant
qualquer papel + unitIds vazio       → 400 VALIDATION_ERROR
clinicId divergente                  → 403 CLINIC_ACCESS_DENIED
nome duplicado                       → 409 PATIENT_ALREADY_EXISTS
sem autenticação                     → 401/403 conforme SecurityConfiguration
listagem ADMIN                       → todas as unidades da clínica
listagem USER                        → somente a unidade associada
```

O teste atual cobre criação por `ADMIN`, lista vazia, unidade estrangeira, clínica divergente e duplicidade. Ele precisa receber casos de `USER`, porque a alteração de autorização é justamente parte do problema identificado.

## 7. Implementação do frontend, passo a passo

### Passo 9 — Definir o modelo de dados do frontend

Modificar:

- `src/@types/patient.ts`;
- eventualmente `src/@types/appointment.ts` apenas para reutilizar `AppointmentRole`, `UnitOption` ou tipos compartilhados;
- documentação de tipos.

O modelo atual:

```ts
export interface CreatePatientInput {
  name: string
}
```

Deve evoluir para algo como:

```ts
export interface PatientListItem {
  id: string
  code: number
  name: string
  clinicId: string
  unitIds: string[]
  createdAt: string
  status?: PatientStatus
  principalService?: PatientPrincipalService | null
}

export type PatientStatus = 'ATIVO' | 'INATIVO' | 'EM_ATENDIMENTO'

export interface PatientPrincipalService {
  id: string
  name: string
}

export interface CreatePatientInput {
  name: string
  unitIds: string[]
}
```

Se o backend não entregar status ou serviço, os campos devem ser opcionais e a tela deve apresentar `—`. Não declarar como obrigatório no TypeScript algo que o backend ainda não garante.

Adicionar também tipos para:

```ts
export interface PatientListQuery {
  page: number
  size: number
  name?: string
  status?: string
  serviceId?: string
}

export interface PatientListResponse {
  content: PatientListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
```

### Passo 10 — Criar um adaptador RTK Query de pacientes

O adaptador atual só contém a mutation:

```ts
// src/features/patients/api/register-patient.ts — estado atual
registerPatient: builder.mutation<void, CreatePatientInput>({
  query: (data) => ({
    url: '/patient/save',
    method: 'POST',
    data,
  }),
})
```

Ele deve passar a tipar a resposta e invalidar a listagem:

```ts
// src/features/patients/api/patients.ts — alvo conceitual
import { baseApi } from '@/lib/base-api'
import type {
  CreatePatientInput,
  PatientListQuery,
  PatientListResponse,
  PatientListItem,
} from '@/@types/patient'

export const patientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query<PatientListResponse, PatientListQuery>({
      query: ({ page, size, name, status, serviceId }) => ({
        url: '/patient/list',
        params: { page, size, name, status, serviceId },
      }),
      providesTags: ['PatientCatalog'],
    }),
    registerPatient: builder.mutation<PatientListItem, CreatePatientInput>({
      query: (data) => ({
        url: '/patient/save',
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: ['PatientCatalog'],
    }),
  }),
})
```

O nome do arquivo pode permanecer `register-patient.ts` se a equipe preferir evitar uma renomeação, mas a responsabilidade deve incluir listagem e criação coerentes. Não manter dois adaptadores concorrentes para o mesmo domínio.

### Passo 11 — Remover a dependência executável do `PatientContext`

Modificar:

- `src/features/patients/model/patient-context.tsx`;
- `src/App.tsx`;
- `src/test/render.tsx`;
- `src/features/patients/pages/patients-page.tsx`;
- `src/features/patients/components/patient-table-filter.tsx`;
- `src/features/patients/components/create-patient-dialog.tsx`.

Depois que a página usar RTK Query para listar e criar:

- remover `createPatient` do contexto;
- remover `fetchPatients` do contexto;
- remover `patients` do contexto;
- remover imports do `PatientContext` na página e no filtro;
- remover `PatientProvider` do `App` se nenhuma outra tela o utilizar;
- remover o `PatientProvider` do wrapper de testes se nenhuma outra tela o utilizar;
- remover `CreatePatientDialog` e seu caminho `POST patients`;
- manter o `AddPatientModal` como o único diálogo ou renomeá-lo para um nome neutro, como `PatientFormDialog`.

Antes de apagar o provider, executar:

```bash
rg -n "PatientProvider|PatientContext|createPatient|fetchPatients" src
```

Só remover o provider quando a busca confirmar que não há consumidor funcional restante.

### Passo 12 — Obter sessão e unidades autorizadas

O frontend já possui o hook de sessão e o catálogo de unidades usado pela agenda:

```ts
// src/features/appointments/api/appointments.ts — existente
useGetAppointmentSessionQuery()
useGetUnitsQuery()
```

O formulário de paciente deve usar a mesma fonte. A regra visual é:

```ts
const sessionQuery = useGetAppointmentSessionQuery()
const unitsQuery = useGetUnitsQuery()
const isBasic = sessionQuery.data?.user.role === 'BASIC'
const activeUnitId = sessionQuery.data?.activeUnitId
```

Para `BASIC`:

- localizar a unidade cujo ID é `activeUnitId`;
- mostrar essa unidade já selecionada;
- impedir troca;
- enviar `unitIds: [activeUnitId]`;
- bloquear submit se a unidade não estiver no catálogo.

Para `ADMIN`:

- permitir seleção somente entre unidades retornadas pelo catálogo da API;
- permitir uma ou mais unidades se o contrato mantiver `List<UUID>`;
- nunca criar uma opção manual com ID digitado;
- enviar somente os IDs selecionados.

O controle desabilitado para `BASIC` é uma ajuda de UX, não autorização. O backend deve repetir a validação.

### Passo 13 — Corrigir o formulário de criação

O schema atual valida apenas nome. O alvo deve validar nome e vínculo:

```tsx
// add-patient-modal.tsx — alvo conceitual
const createPatientSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  unitIds: z.array(z.string().min(1)).min(1, 'Selecione uma unidade'),
})
```

O payload deve ser enviado assim:

```tsx
await registerPatient({
  name: data.name.trim(),
  unitIds: resolvedUnitIds,
}).unwrap()
```

O `resolvedUnitIds` não deve vir diretamente de um campo editável para `BASIC`; deve ser derivado de `session.activeUnitId`.

Eliminar do handler atual:

```tsx
console.log(data)
await new Promise((resolve) => setTimeout(resolve, 2000))
```

O sucesso deve ocorrer quando a API responder. Não usar `setTimeout` para simular processamento.

Durante o submit:

- desabilitar o botão;
- mostrar estado de carregamento;
- evitar duplo envio;
- fechar/resetar somente após sucesso;
- manter os dados se houver erro.

### Passo 14 — Mapear erros da API no modal

O `axiosBaseQuery` devolve:

```ts
export interface AxiosBaseQueryError {
  status: number | 'FETCH_ERROR'
  data: unknown
}
```

O modal não deve exibir sempre `Dados incorretos`. Criar um parser de erro de paciente, por exemplo:

```ts
interface PatientApiError {
  code?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

function patientErrorMessage(error: unknown) {
  const data = (error as { data?: PatientApiError })?.data

  switch (data?.code) {
    case 'PATIENT_ALREADY_EXISTS':
      return 'Já existe um paciente com esse nome.'
    case 'CLINIC_ACCESS_DENIED':
      return 'A clínica informada não pertence à sua sessão.'
    case 'UNIT_ACCESS_DENIED':
      return 'Você só pode cadastrar pacientes na sua unidade autorizada.'
    case 'TENANT_RESOURCE_NOT_FOUND':
      return 'A unidade selecionada não está disponível para esta clínica.'
    case 'VALIDATION_ERROR':
      return 'Revise o nome e a unidade selecionada.'
    default:
      return 'Não foi possível cadastrar o paciente. Tente novamente.'
  }
}
```

O código precisa ser adaptado ao formato real de `unwrap()` do RTK Query, mas a ideia é preservar o contrato de erro e dar retorno útil para a pessoa.

### Passo 15 — Refatorar a página para RTK Query

O código atual usa `useEffect` e contexto:

```tsx
// patients-page.tsx — estado atual
const patients = useContextSelector(
  PatientContext,
  (context) => context.patients,
)

useEffect(() => {
  fetchPatients().then((res) => {
    console.log('Dados da api na page', res.data.content)
  })
}, [])
```

O alvo deve manter estado de filtro/página e consultar a API declarativamente:

```tsx
// patients-page.tsx — alvo conceitual
const [page, setPage] = useState(0)
const [filters, setFilters] = useState<PatientFilters>(emptyFilters)

const patientsQuery = useGetPatientsQuery({
  page,
  size: PAGE_SIZE,
  ...filters,
})

const rows = patientsQuery.data?.content ?? []
```

A página deve tratar:

- `isLoading`: skeleton ou estado de carregamento;
- `isError`: mensagem e botão “Tentar novamente”;
- resposta vazia: estado “Nenhum paciente encontrado”;
- sucesso: tabela com os itens;
- criação concluída: invalidação/refetch por tag `PatientCatalog`;
- mudança de filtro: voltar para página zero;
- mudança de página: preservar filtros.

### Passo 16 — Estruturar o cabeçalho visual

A página deve reproduzir a hierarquia da referência:

```text
Pacientes
Gerencie o cadastro, histórico e atendimentos dos seus pacientes.

[ + Novo Paciente ]

[ Nome do paciente... ] [ Todos os status ] [ Todos os serviços ] [ Limpar filtros ]
```

Regras visuais:

- usar os tokens de cor já adotados no produto;
- verde forte para cabeçalho/ação primária;
- fundo claro e card com borda/sombra discreta;
- bordas arredondadas consistentes;
- foco visível no teclado;
- texto não pode depender apenas de cor;
- botão primário precisa ter nome acessível;
- filtros precisam ter labels ou `aria-label` claros;
- não usar dados da imagem como conteúdo fixo.

### Passo 17 — Refatorar a linha da tabela

O componente atual recebe apenas `name`. O alvo deve receber o item completo:

```tsx
// patient-table-rows.tsx — alvo conceitual
interface PatientTableRowProps {
  patient: PatientListItem
  onUnavailableAction?: (action: string) => void
}
```

Estrutura alvo:

```tsx
<TableRow>
  <TableCell>
    <Button aria-label={`Ver detalhes de ${patient.name}`} disabled>
      <Search aria-hidden="true" />
    </Button>
  </TableCell>

  <TableCell>{patient.code}</TableCell>

  <TableCell>
    <div className="flex items-center gap-3">
      <Avatar aria-hidden="true">{initials(patient.name)}</Avatar>
      <span>{patient.name}</span>
    </div>
  </TableCell>

  <TableCell>
    {patient.principalService?.name ?? '—'}
  </TableCell>

  <TableCell>
    <PatientStatusBadge status={patient.status} />
  </TableCell>

  <TableCell>{formatPatientDate(patient.createdAt)}</TableCell>

  <TableCell>
    <Button disabled={!editPatientImplemented}>Editar</Button>
    <Button disabled={!deactivatePatientImplemented}>Desativar</Button>
  </TableCell>
</TableRow>
```

O código acima é uma composição-alvo. Os botões não devem ser habilitados até existir mutation, endpoint, confirmação e teste para cada operação.

### Passo 18 — Definir o badge de status sem inventar domínio

O badge precisa ser textual e visual:

```tsx
function PatientStatusBadge({ status }: { status?: PatientStatus }) {
  if (!status) return <span>—</span>

  const presentation = statusPresentation[status]

  return (
    <span className={presentation.className}>
      <span aria-hidden="true">{presentation.icon}</span>
      {presentation.label}
    </span>
  )
}
```

Se `PatientStatus` não for um campo real do backend nesta change, o badge deve apresentar `—` ou não ser exibido. Não transformar o status de um agendamento em status permanente do paciente sem contrato explícito.

### Passo 19 — Tornar a paginação funcional

O componente atual deve receber callbacks:

```tsx
// pagination.tsx — alvo conceitual
interface PaginationProps {
  pageIndex: number
  totalPages: number
  totalCount: number
  isFirst: boolean
  isLast: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
  onLast: () => void
}
```

Cada botão deve:

- usar `disabled` no limite;
- possuir `aria-label` específico;
- chamar a mudança de página;
- preservar filtros;
- atualizar o texto “Página X de Y”;
- usar `totalElements` retornado pela API.

### Passo 20 — Implementar filtros honestos

O formulário atual deve deixar de depender do contexto:

```tsx
// patient-table-filter.tsx — alvo conceitual
interface PatientTableFilterProps {
  value: PatientFilters
  onChange: (filters: PatientFilters) => void
  onClear: () => void
}
```

Fluxo esperado:

1. pessoa preenche nome/status/serviço;
2. submit chama `onChange`;
3. página zera `page`;
4. RTK Query faz nova chamada com parâmetros;
5. “Limpar filtros” restaura estado inicial e página zero.

Se o backend ainda não suportar status ou serviço, não apresentar esses campos como funcionais. É preferível entregar menos filtros verdadeiros do que filtros decorativos.

### Passo 21 — Estados de carregamento, erro e vazio

Adicionar cobertura visual para:

```text
carregando → skeleton da tabela ou mensagem de carregamento
erro       → mensagem + botão tentar novamente
vazio      → mensagem + ação Novo Paciente
sucesso    → tabela e paginação
```

Esses estados precisam ser percebidos por tecnologia assistiva, usando `role="status"`, `role="alert"` ou estrutura equivalente quando apropriado.

## 8. Testes do frontend

### 8.1 Atualizar o teste de criação

O teste atual espera o payload incompleto:

```tsx
// patient-create.integration.test.tsx — estado atual
await waitFor(() => expect(body).toEqual({ name: 'Beatriz' }))
```

O teste deve configurar `/auth/me` e `/api/units`, abrir o formulário e esperar:

```tsx
await waitFor(() =>
  expect(body).toEqual({
    name: 'Beatriz',
    unitIds: ['unit-a'],
  }),
)
```

Adicionar casos para:

- `ADMIN` selecionando unidade própria;
- `BASIC` recebendo unidade ativa bloqueada;
- `BASIC` sem unidade ativa no catálogo;
- erro de validação;
- erro de duplicidade;
- erro de unidade não autorizada;
- preservação dos dados após falha;
- botão desabilitado durante submit.

### 8.2 Atualizar os handlers MSW

Modificar `src/test/server.ts` para conter:

- resposta realista de `GET /patient/list` com paginação;
- captura de query params `page`, `size`, `name`, `status`, `serviceId`;
- `POST /patient/save` com captura do payload;
- respostas de `400`, `403`, `404`, `409` e sucesso;
- sessão `ADMIN` e sessão `BASIC` configuráveis por teste;
- catálogos de unidades compatíveis com a sessão.

Não deixar o handler responder sucesso para `{ name }` se o contrato exige `unitIds`; o teste precisa detectar regressões.

### 8.3 Atualizar o teste da página

Modificar `patients-page.integration.test.tsx` para verificar:

- renderização de código real;
- nome e iniciais;
- serviço quando disponível e `—` quando ausente;
- status textual;
- data formatada;
- total e página vindos da resposta;
- filtro enviando os parâmetros corretos;
- limpeza dos filtros;
- paginação primeiro/anterior/próximo/último;
- estado vazio;
- estado de erro e retry;
- ações não implementadas não disparam requests.

### 8.4 Testes de acessibilidade e responsividade

Verificar pelo menos:

- todos os botões têm nome acessível;
- inputs e selects possuem labels;
- foco de teclado é visível;
- tabela não perde informação em viewport compacto;
- status não é comunicado apenas por cor;
- erro é anunciado;
- modal pode ser fechado e reaberto sem estado sujo.

## 9. Inventário de arquivos

### 9.1 Frontend

| Arquivo | Estado atual | Modificação necessária |
| --- | --- | --- |
| `src/@types/patient.ts` | Tipos mínimos e `CreatePatientInput` só com nome | Adicionar modelo de linha, resposta paginada, filtros, status opcional e `unitIds` |
| `src/features/patients/api/register-patient.ts` | Mutation para `/patient/save`, resposta `void` | Tipar resposta, invalidar listagem e/ou consolidar em `patients.ts` |
| `src/features/patients/model/patient-context.tsx` | GET funcional e POST plural legado | Remover do fluxo ou reduzir/remover provider após migração para RTK Query |
| `src/features/patients/pages/patients-page.tsx` | Contexto, tabela simples, paginação fixa | Query paginada, filtros, estados, card visual e modal único |
| `src/features/patients/components/add-patient-modal.tsx` | Envia só nome, erro genérico, delay artificial | Sessão/unidade, `unitIds`, estados de submit, erros reais |
| `src/features/patients/components/create-patient-dialog.tsx` | Usa `POST patients` via contexto | Remover ou substituir pelo único formulário oficial |
| `src/features/patients/components/patient-table-filter.tsx` | Refaz GET sem filtros | Formulário controlado com filtros reais e limpar |
| `src/features/patients/components/patient-table-rows.tsx` | Código/data/status fixos e ações sem callback | Renderizar contrato da API, avatar, badge e ações honestas |
| `src/features/patients/components/pagination.tsx` | Botões sem handlers | Callbacks, limites, metadados reais e acessibilidade |
| `src/features/patients/README.md` | Documenta dois fluxos e lacunas legadas | Documentar endpoint único, escopo e campos da resposta |
| `src/App.tsx` | Monta `PatientProvider` global | Remover provider quando não houver consumidor |
| `src/test/render.tsx` | Monta provider em todos os testes | Remover ou manter somente se outro fluxo ainda depender dele |
| `src/test/server.ts` | Não possui fluxo real de criação/listagem paginada de paciente | Adicionar handlers, cenários e erros do contrato |
| `src/features/patients/__tests__/patient-create.integration.test.tsx` | Espera payload `{ name }` | Esperar `{ name, unitIds }` e cobrir erros/papéis |
| `src/features/patients/__tests__/patients-page.integration.test.tsx` | Verifica apenas duas linhas e refetch simples | Cobrir paginação, filtros, estados e dados reais |
| `src/features/appointments/api/appointments.ts` | Já fornece sessão e unidades | Reutilizar hooks; alterar somente se a API de catálogo mudar |
| `src/features/session/model/session.ts` | Já valida `role` e `activeUnitId` | Reutilizar e testar sessão BASIC incompleta |

### 9.2 Backend

| Arquivo | Estado atual | Modificação necessária |
| --- | --- | --- |
| `controller/patient/PatientController.java` | Criação somente para `ADMIN` | Aceitar `ADMIN` e `USER`; alinhar status de criação se aprovado |
| `service/PatientService.java` | Valida clínica/unidades, mas não limita USER na criação | Validar unidade associada do principal e preservar isolamento |
| `service/UnitScopeService.java` | Resolve unidades permitidas para leitura | Reutilizar para criação ou expor validação de forma centralizada |
| `dtos/patient/PatientRequestDTO.java` | Já exige `name` e `unitIds` | Manter, documentar e cobrir validação |
| `dtos/patient/PatientResponseDTO.java` | Só id/nome/clínica/unidades | Adicionar código/data e `PrincipalServiceResponse` opcional somente com origem real |
| `dtos/patient/PrincipalServiceResponse.java` | Não existe | Criar record público com `UUID id` e `String name` se o campo fizer parte do response |
| `mapper/PatientMapper.java` | Omite código/data/status/serviço | Mapear código/data e campos opcionais aprovados |
| `model/patient/Patient.java` | Tem clínica, unidades, código e criação | Preservar vínculos; só adicionar status com decisão de domínio |
| `repository/PatientRepository.java` | Paginação por clínica/unidade, sem filtros | Adicionar filtros somente quando o contrato estiver definido |
| `controller/exception/ApiExceptionHandler.java` | Já mapeia validação, tenant e duplicidade | Adicionar erro de unidade somente se não reutilizar código existente |
| `db/migration/V003__create_table_patient.sql` | `clinic_id` obrigatório | Não remover; verificar integridade |
| `db/migration/V010__add_clinic_structure_and_unit_links.sql` | Cria `PATIENT_UNIT` e trigger de mesma clínica | Preservar; criar migration nova somente para novo dado persistido |
| `db/seed/dev/R__009_seed_patient_unit.sql` | Vincula pacientes existentes à unidade | Preservar e verificar seed após mudança |
| `controller/patient/README.md` | Contradiz autorização do controller em partes | Atualizar regra para `ADMIN`/`BASIC` e contrato real |
| `service/README.md` | Já declara cadastro por ADMIN/BASIC | Alinhar com testes e regra implementada |
| `controller/patient/PatientRegistrationControllerIntegrationTest.java` | Cobre principalmente ADMIN | Adicionar USER/BASIC e contrato de resposta |
| `BasicUnitScopeIntegrationTest.java` | Cobre leitura escopada | Adicionar criação escopada quando necessário |

## 10. Ordem recomendada de entrega

### Fase A — Contrato e testes de backend

1. Confirmar o papel `USER` e a `clinicUnit` da sessão.
2. Adicionar teste que reproduz o 403 atual para `USER` e depois ajustar a autorização.
3. Adicionar teste de `USER` com unidade correta.
4. Adicionar teste de `USER` tentando unidade diferente.
5. Implementar validação no service.
6. Definir campos reais da resposta.
7. Implementar ou adiar filtros conforme a decisão de domínio.
8. Atualizar READMEs do backend.

### Fase B — Adaptadores e modelo frontend

1. Atualizar tipos.
2. Atualizar MSW.
3. Criar query paginada de pacientes.
4. Atualizar mutation de criação.
5. Integrar sessão e catálogo de unidades.
6. Remover fluxo plural legado.

### Fase C — Tela e experiência visual

1. Refatorar o modal único.
2. Refatorar cabeçalho e filtros.
3. Refatorar tabela/linha.
4. Implementar estados de carregamento/erro/vazio.
5. Implementar paginação.
6. Aplicar cores, espaçamento, bordas, chips e responsividade.
7. Desabilitar ações sem contrato.

### Fase D — Verificação

Executar no backend:

```bash
./mvnw test
```

ou o comando Maven equivalente definido no projeto, incluindo os testes de integração que dependem do PostgreSQL.

Executar no frontend:

```bash
npm run lint
npm run build
npm run test -- src/features/patients/__tests__ --reporter=dot
```

Executar na raiz do frontend:

```bash
openspec validate modernizar-listagem-e-vincular-pacientes --strict
```

Se algum teste não puder rodar por falta de banco, serviço ou dependência externa, registrar o comando e o bloqueio real em `tasks.md`; não marcar a tarefa como concluída por inferência.

## 11. Critérios de aceite

A entrega só está pronta quando todos os itens forem verdadeiros:

- `ADMIN` consegue criar paciente em unidade própria;
- `BASIC` consegue criar paciente somente em sua unidade ativa;
- `BASIC` não consegue ampliar escopo alterando o payload;
- unidade estrangeira nunca é persistida;
- a clínica é derivada da sessão;
- o frontend envia `unitIds`;
- nenhum caminho da tela chama `POST patients`;
- a listagem usa dados reais da API;
- código, data, total e página não são constantes;
- filtros apresentados têm efeito real;
- paginação consulta as páginas corretas;
- erro de validação, autorização, escopo e duplicidade é compreensível;
- estado vazio e erro são recuperáveis;
- status não é representado apenas por cor;
- serviço principal não é inventado;
- editar/desativar/detalhe não aparentam funcionar sem endpoint;
- testes do backend e frontend cobrem os papéis e os limites de tenant;
- lint, build e `openspec validate --strict` passam;
- READMEs não descrevem mais `POST patients` como fluxo ativo.

## 12. Resultado esperado da implementação

Depois da execução deste guia, a tela deverá sair da tabela legada com dados fixos para uma listagem visualmente próxima à referência, mas tecnicamente verdadeira: cada paciente exibido virá da API, cada cadastro terá vínculo explícito com unidade, o usuário básico ficará limitado pelo servidor e a interface deixará claro quando uma informação ou ação ainda não possui contrato de domínio.
