# Guia de implementação do backend de pacientes

## 1. Objetivo

Este documento é a parte **backend** do guia técnico da change
`modernizar-listagem-e-vincular-pacientes`. Ele complementa o
[`implementation-patient-front-guide.md`](implementation-patient-front-guide.md)
e substitui, para a execução da API, as seções equivalentes do
[`implementation-guide.md`](implementation-guide.md).

O backend auditado está em:

```text
/home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api
```

A instância local consultada está em:

```text
http://localhost:8080
```

Este guia descreve, sem omitir os arquivos afetados:

- a causa comprovada da falha atual de cadastro;
- o contrato HTTP final de criação e listagem;
- a autorização correta para `ADMIN` e `USER` (`BASIC` no frontend);
- o vínculo obrigatório entre paciente, clínica e unidade;
- o novo `PrincipalServiceResponse`;
- o `PatientResponseDTO` ampliado;
- a interface `PatientMapper` completa;
- o novo método privado `validateClinicId`;
- paginação e filtro por nome com isolamento de tenant/unidade;
- o tratamento honesto de status e serviço principal ainda sem fonte de
  domínio;
- código completo de cada arquivo novo;
- comparação entre o código anterior, o worktree atual e o código-alvo;
- testes de integração completos;
- documentação e comandos de validação.

Este arquivo é um roteiro de implementação. Nenhum código Java, migration ou
dado foi alterado durante sua criação.

## 2. Fontes de verdade e estado do worktree

Foram considerados, nesta ordem:

1. a instrução atual;
2. a change frontend `modernizar-listagem-e-vincular-pacientes`;
3. a change backend `relacionar-usuarios-unidades-clinicas`;
4. as specs backend `patients`, `clinic-structure` e `runtime-and-errors`;
5. o código efetivamente presente no disco;
6. consultas não mutáveis à API em execução;
7. documentação do backend.

O repositório backend possui alterações locais preexistentes e elas devem ser
preservadas:

```text
M  PatientController.java
M  PatientResponseDTO.java
M  PatientMapper.java
M  PatientService.java
?? PrincipalServiceResponse.java
```

Essas alterações já incorporam parte das últimas decisões, mas ainda não
formam uma entrega funcional. Este guia distingue três estados:

| Estado                   | Significado                                        |
| ------------------------ | -------------------------------------------------- |
| código anterior (`HEAD`) | comportamento antes das alterações locais          |
| worktree observado       | código atual no disco e na API em execução         |
| código-alvo              | estado completo recomendado para concluir a change |

Não sobrescrever nem descartar o worktree. A implementação deve aplicar apenas
os deltas ainda necessários, revisando cada arquivo antes de editar.

## 3. Diagnóstico comprovado

### 3.1 Fluxo atual

```text
POST /patient/save
  └── PatientController.savePatient
      ├── @PreAuthorize
      └── PatientService.save
          ├── authenticatedUser
          ├── validateClinicId
          ├── UnitScopeService
          ├── UnitRepository.findAllByClinicIdAndIdIn
          ├── PatientMapper.toEntity
          ├── PatientRepository.findByName
          ├── PatientRepository.saveAndFlush
          └── PatientMapper.toDto
```

```text
GET /patient/list
  └── PatientController.findAllPatient
      └── PatientService.findAllPatient
          ├── authenticatedUser
          ├── ADMIN → findAllByClinicId
          ├── USER  → findAllByClinicIdAndUnits_Id
          ├── PatientMapper.toDto
          └── PageResponseDTO.from
```

### 3.2 Causa imediata da impossibilidade de cadastrar

O worktree atual contém:

```java
@PreAuthorize("hasRole('ADMIN', 'USER')")
```

`hasRole` recebe um único papel. A expressão com dois argumentos não é uma
forma válida de autorizar qualquer um dos dois papéis. O método correto é:

```java
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
```

A API local confirmou o problema sem criar dados. Um request com nome já
existente, construído para terminar em conflito antes de qualquer persistência,
produziu para os dois papéis:

```text
ADMIN → HTTP 400, code=INVALID_REQUEST
BASIC → HTTP 400, code=INVALID_REQUEST
```

Mensagem técnica observada:

```text
Failed to evaluate expression 'hasRole('ADMIN', 'USER')'
```

A contagem de pacientes antes e depois permaneceu igual. Portanto, a falha
acontece na avaliação de autorização, antes do fluxo de domínio.

### 3.3 Problema anterior do papel

Antes da alteração local, o controller possuía:

```java
@PreAuthorize("hasRole('ADMIN')")
```

Isso bloqueava legitimamente `USER`, embora o requisito permita que o papel
operacional — apresentado como `BASIC` pelo `/auth/me` — cadastre na própria
unidade. A correção não é remover a segurança; é usar `hasAnyRole` e repetir a
restrição de unidade no service.

### 3.4 Problema anterior do payload

O frontend antigo enviava:

```json
{
  "name": "Beatriz"
}
```

O request backend exige:

```java
@NotEmpty List<@NotNull UUID> unitIds
```

Logo, mesmo com autorização correta, o payload sem `unitIds` deve resultar em
`400 VALIDATION_ERROR`. O contrato final será:

```json
{
  "name": "Beatriz",
  "unitIds": ["<unit-id-autorizada>"]
}
```

### 3.5 Divergência de status nos testes

O controller atual já responde:

```java
return ResponseEntity.status(HttpStatus.CREATED).body(response);
```

Mas `PatientRegistrationControllerIntegrationTest` ainda espera `200 OK` em
três cenários de sucesso. Esses testes estão desatualizados e devem esperar
`201 Created`.

### 3.6 Campos da listagem

A API em execução já devolve estas chaves em cada item:

```text
clinicId, code, createdAt, id, name, principalService, status, unitIds
```

Tipos/nullabilidade observados sem expor dados de pacientes:

```text
code                 → number
createdAt            → string
unitIds              → array
status               → null
principalService     → null
```

Esse resultado está correto para o estado atual: `Patient` possui `code` e
`createdAt`, mas não possui status nem relação direta com serviço principal.

### 3.7 Filtros atualmente ignorados

Consultas autenticadas retornaram o mesmo total para:

```text
sem filtro
name=__codex_no_match__
status=__UNKNOWN__
serviceId=00000000-0000-0000-0000-000000000000
```

Portanto, `name`, `status` e `serviceId` não são filtros hoje; o Spring apenas
ignora parâmetros desconhecidos.

Este guia implementa **filtro remoto por nome**, porque existe fonte real no
modelo. Os filtros de status e serviço principal não devem ser publicados
como funcionais até uma change definir sua origem.

### 3.8 Segurança da listagem

A API local confirmou:

```text
GET /patient/list sem autenticação → HTTP 403
GET /patient/list como ADMIN       → HTTP 200
GET /patient/list como BASIC       → HTTP 200
```

`ADMIN` e `BASIC` receberam o envelope:

```text
content, last, page, size, totalElements, totalPages
```

O bloqueio anônimo usa atualmente o erro padrão do Spring:

```text
error, message, path, status, timestamp
```

Ele não usa `ApiErrorResponse`. Isso é uma divergência operacional que o
frontend deve tratar de forma genérica. Uniformizar erros de autenticação do
Spring Security é uma melhoria transversal e não será adicionada escondida
nesta change.

## 4. Decisões de domínio

### 4.1 Clínica vem do principal

O request pode continuar aceitando `clinicId` temporariamente por
compatibilidade, mas ele nunca define o tenant. O service deve sempre usar:

```java
UUID clinicId = principal.getClinic().getId();
```

Se o cliente legado enviar outro valor, `validateClinicId` devolve
`403 CLINIC_ACCESS_DENIED`.

### 4.2 `validateClinicId` é método novo em relação ao código anterior

No código anterior, a comparação estava embutida em `save`. O worktree atual
já extraiu corretamente a função privada. O método não deve ser procurado em
outra classe e não deve virar validação frontend:

```java
private void validateClinicId(
        UUID requestedClinicId,
        UUID authenticatedClinicId) {
    if (requestedClinicId != null
            && !requestedClinicId.equals(authenticatedClinicId)) {
        throw new DomainException(
                "CLINIC_ACCESS_DENIED",
                "O clinicId informado não corresponde à clínica autenticada.",
                HttpStatus.FORBIDDEN);
    }
}
```

### 4.3 Regra de unidade

- `ADMIN`: pode informar uma ou mais unidades, desde que todas pertençam à
  clínica autenticada;
- `USER`/`BASIC`: deve informar exatamente o conjunto contendo sua única
  `clinicUnit` autorizada;
- lista vazia: rejeitada por Jakarta Validation e novamente protegida no
  service;
- unidade de outra clínica: tratada como recurso não encontrado para não
  revelar existência externa;
- o trigger PostgreSQL `trg_patient_unit_same_clinic` continua como última
  defesa no banco.

### 4.4 Duplicidade

A regra atual é global por nome normalizado. Ela será preservada nesta change,
como definido no design. Alterar para unicidade por clínica exige decisão de
produto, constraint/migration e tratamento de concorrência próprios.

### 4.5 Status do paciente

`Patient` não possui campo de status. Status de agendamento não é status
permanente do paciente. Assim:

```java
status = null
```

Não adicionar migration, enum ou valor `ATIVO` apenas para colorir a tela.

### 4.6 Serviço principal

Não existe relação `Patient → ServiceOffering` que identifique serviço
principal. O novo record representa a projeção de resposta, mas não define a
regra de escolha:

```java
public record PrincipalServiceResponse(UUID id, String name) {}
```

Até uma change decidir se o principal é explícito, mais frequente, mais
recente ou outro critério:

```java
principalService = null
```

O mapper não consulta repository e não escolhe serviço.

### 4.7 Filtros desta entrega

Contrato implementável agora:

```text
page, size, sort, name
```

Contrato adiado:

```text
status, serviceId
```

O frontend deve ocultar/desabilitar esses dois filtros até o contrato existir.

## 5. Contratos HTTP finais

### 5.1 `POST /patient/save`

Autorização:

```text
ROLE_ADMIN ou ROLE_USER
```

Request recomendado:

```json
{
  "name": "Beatriz",
  "unitIds": ["<uuid>"]
}
```

Request legado ainda aceito:

```json
{
  "name": "Beatriz",
  "clinicId": "<mesma-clinica-da-sessao>",
  "unitIds": ["<uuid>"]
}
```

Resposta de sucesso:

```http
HTTP/1.1 201 Created
```

```json
{
  "id": "<uuid>",
  "code": 5001,
  "name": "BEATRIZ",
  "clinicId": "<uuid>",
  "unitIds": ["<uuid>"],
  "createdAt": "2026-11-17T12:00:00",
  "status": null,
  "principalService": null
}
```

### 5.2 `GET /patient/list`

```http
GET /patient/list?page=0&size=5&sort=code,asc&name=Ana
Authorization: Bearer <token>
```

Resposta:

```json
{
  "content": [],
  "page": 0,
  "size": 5,
  "totalElements": 0,
  "totalPages": 0,
  "last": true
}
```

O filtro por nome é combinado obrigatoriamente com o escopo:

```text
ADMIN → clinic_id + name
USER  → clinic_id + unit_id + name
```

### 5.3 Matriz de erros

| Situação                                 |                             HTTP | Código                      |
| ---------------------------------------- | -------------------------------: | --------------------------- |
| nome vazio, `unitIds` vazio ou UUID nulo |                              400 | `VALIDATION_ERROR`          |
| corpo ilegível                           |                              400 | `INVALID_REQUEST`           |
| `clinicId` divergente                    |                              403 | `CLINIC_ACCESS_DENIED`      |
| `USER` tenta outra unidade               |                              403 | `UNIT_ACCESS_DENIED`        |
| unidade inexistente/de outra clínica     |                              404 | `TENANT_RESOURCE_NOT_FOUND` |
| nome duplicado                           |                              409 | `PATIENT_ALREADY_EXISTS`    |
| sem autenticação                         | 401/403 atual do Spring Security | envelope genérico atual     |

## 6. Inventário completo

### 6.1 Arquivo novo

| Arquivo                                                           | Intuito                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `dtos/patient/PrincipalServiceResponse.java`                      | projetar ID/nome do serviço principal quando houver fonte real |
| `controller/patient/PatientListingControllerIntegrationTest.java` | provar paginação, nome, tenant, unidade e JSON                 |

### 6.2 Arquivos atualizados

| Arquivo                                             | Alteração                                                 |
| --------------------------------------------------- | --------------------------------------------------------- |
| `PatientController.java`                            | corrigir `hasAnyRole`, injeção, filtro por nome e 201     |
| `PatientResponseDTO.java`                           | incluir código, data, status e serviço opcional           |
| `PatientMapper.java`                                | mapear resposta completa e ausência segura                |
| `PatientServiceInt.java`                            | representar listagem filtrada e criação                   |
| `PatientService.java`                               | autorização de unidade, nome filtrado e helpers completos |
| `PatientRepository.java`                            | queries paginadas escopadas com filtro de nome            |
| `PatientRegistrationControllerIntegrationTest.java` | 201, `USER`, escopo e campos do JSON                      |
| `controller/patient/README.md`                      | contrato real de endpoints e papéis                       |
| `dtos/patient/README.md`                            | DTO ampliado e nullabilidade                              |
| `mapper/README.md`                                  | mapper sem resolução de domínio                           |
| `model/patient/README.md`                           | vínculo com unidades e campos ausentes                    |
| `repository/README.md`                              | queries escopadas e filtro por nome                       |
| `service/README.md`                                 | fluxo real e débitos atuais                               |
| `docs/ARQUITETURA_DO_SISTEMA.md`                    | proteção e fluxos efetivamente entregues                  |
| `docs/OBJETIVO_DO_SISTEMA.md`                       | atores, cadastro e listagem atuais                        |

### 6.3 Arquivos revisados sem mudança

| Arquivo                      | Motivo para não alterar                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `PatientRequestDTO.java`     | já valida nome e `unitIds` não vazio                                    |
| `Patient.java`               | já possui código/data/clínica/unidades; status não foi definido         |
| `PageResponseDTO.java`       | já contém todos os metadados necessários                                |
| `UnitScopeService.java`      | já resolve ADMIN versus unidade única de USER                           |
| `UnitRepository.java`        | já resolve IDs somente dentro da clínica                                |
| `SecurityConfiguration.java` | já protege `GET /patient/list`; POST é autenticado e refinado no método |
| `ApiExceptionHandler.java`   | já mapeia validação, domínio e duplicidade                              |
| migrations `V003` e `V010`   | schema e trigger já sustentam a regra atual                             |

### 6.4 Planejamento obrigatório no backend

Antes dos arquivos Java, criar uma change OpenSpec no próprio repositório da
API com proposta, design, delta de `patients` e tarefas. O conteúdo mínimo está
descrito na seção 20.

### 6.5 Arquivos que não devem ser criados agora

- migration de status de paciente;
- enum `PatientStatus` no backend;
- repository/resolver de serviço principal;
- relação JPA artificial entre paciente e serviço;
- endpoint paralelo `/api/patients` para a mesma listagem;
- validação de clínica no mapper ou controller frontend.

## 7. Ordem de implementação

1. corrigir o controller para `hasAnyRole`;
2. consolidar DTOs e mapper;
3. ampliar interface, repository e service para filtro por nome;
4. atualizar testes de criação;
5. criar testes da listagem;
6. atualizar READMEs;
7. compilar e executar testes direcionados;
8. validar a API local sem registrar dados sensíveis;
9. executar a suíte completa e OpenSpec.

## 8. Controller

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/controller/patient/PatientController.java
```

### Como era no código anterior

```java
@PostMapping("/save")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<PatientResponseDTO> savePatient(...) {
    PatientResponseDTO response = patientService.save(dto, authentication);
    return ResponseEntity.ok(response);
}
```

Problemas:

- `USER` não era autorizado;
- sucesso retornava `200`, apesar de criar um recurso;
- injeção era por campo;
- a listagem não recebia filtro real.

### Como está no worktree

```java
@PostMapping("/save")
@PreAuthorize("hasRole('ADMIN', 'USER')")
public ResponseEntity<PatientResponseDTO> savePatient(...) {
    PatientResponseDTO response = patientService.save(dto, authentication);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

A mudança para `201` está correta. A expressão de autorização está incorreta e
impede ambos os papéis de entrar no método.

### Como deve ficar — arquivo completo

```java
package com.agendamento.smart.controller.patient;

import com.agendamento.smart.dtos.PageResponseDTO;
import com.agendamento.smart.dtos.patient.PatientRequestDTO;
import com.agendamento.smart.dtos.patient.PatientResponseDTO;
import com.agendamento.smart.service.PatientServiceInt;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientServiceInt patientService;

    @GetMapping("/list")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<PageResponseDTO<PatientResponseDTO>> findAllPatient(
            @PageableDefault(
                    size = 5,
                    sort = "code",
                    direction = Sort.Direction.ASC)
            Pageable pageable,
            @RequestParam(required = false) String name,
            Authentication authentication) {
        PageResponseDTO<PatientResponseDTO> response =
                patientService.findAllPatient(pageable, name, authentication);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/save")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<PatientResponseDTO> savePatient(
            @RequestBody @Valid PatientRequestDTO dto,
            Authentication authentication) {
        PatientResponseDTO response = patientService.save(dto, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

### Explicação

- `hasAnyRole` representa corretamente a disjunção entre os dois papéis;
- `USER` é o papel persistido; o frontend o apresenta como `BASIC`;
- a anotação no GET documenta a mesma regra já aplicada na
  `SecurityConfiguration`;
- `PageableDefault` torna a primeira chamada estável e alinhada à tela;
- o cliente ainda pode informar `page`, `size` e `sort` pela convenção Spring;
- `name` é o único filtro de domínio suportado nesta etapa;
- `PatientServiceInt` deixa de ser uma interface parcial e passa a representar
  as duas operações do controller;
- injeção por construtor permite campos finais e facilita teste.

## 9. Request de criação

### Arquivo revisado sem mudança

```text
src/main/java/com/agendamento/smart/dtos/patient/PatientRequestDTO.java
```

### Como está e como deve permanecer — arquivo completo

```java
package com.agendamento.smart.dtos.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record PatientRequestDTO(
        @NotBlank @Size(max = 255) String name,
        UUID clinicId,
        @NotEmpty List<@NotNull UUID> unitIds
) {
}
```

### Explicação

- `name` rejeita `null`, vazio e somente espaços;
- o tamanho segue `PATIENT.name VARCHAR(255)`;
- `clinicId` permanece opcional e não autoritativo para compatibilidade;
- `unitIds` não pode ser nulo/vazio e seus elementos não podem ser nulos;
- IDs repetidos são consolidados no service por `LinkedHashSet`;
- remover `clinicId` é uma quebra de contrato e deve ocorrer somente depois da
  migração dos clientes legados.

## 10. Response do serviço principal

### Arquivo novo

```text
src/main/java/com/agendamento/smart/dtos/patient/PrincipalServiceResponse.java
```

### Intuito

Fornecer uma projeção mínima e desacoplada da entidade
`ServiceOffering`. O record existe para o contrato de saída, mas não resolve
qual serviço deve ser considerado principal.

### Código completo

```java
package com.agendamento.smart.dtos.patient;

import java.util.UUID;

public record PrincipalServiceResponse(
        UUID id,
        String name
) {
}
```

### Regras

- não expor entidade JPA;
- não incluir preço, duração ou capacidade sem necessidade da tela;
- retornar `null` quando o paciente não possuir serviço principal resolvido;
- não construir com um serviço fixo;
- não consultar repository dentro do record ou mapper.

## 11. Response de paciente

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/dtos/patient/PatientResponseDTO.java
```

### Como era

```java
public record PatientResponseDTO(
        UUID id,
        String name,
        UUID clinicId,
        List<UUID> unitIds
) {
}
```

O frontend não conseguia apresentar código ou data sem valores fixos.

### Como está no worktree

O conteúdo já possui os campos corretos, mas a formatação está inconsistente:

```java
public record PatientResponseDTO(
             UUID id,
             Long code,
             String name,
             UUID clinicId,
             List<UUID> unitIds,
             LocalDateTime createdAt,
             String status,
             PrincipalServiceResponse principalService)
{}
```

### Como deve ficar — arquivo completo

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

### Origem de cada campo

| Campo              | Origem                                 | Nullabilidade esperada             |
| ------------------ | -------------------------------------- | ---------------------------------- |
| `id`               | `Patient.id`                           | não nulo após persistência         |
| `code`             | `CodeGeneratorListener`/`Patient.code` | não nulo após persistência         |
| `name`             | nome normalizado                       | não nulo                           |
| `clinicId`         | `Patient.clinic.id`                    | não nulo no domínio persistido     |
| `unitIds`          | `Patient.units`                        | lista não vazia para dados válidos |
| `createdAt`        | `@CreationTimestamp`                   | não nulo após flush                |
| `status`           | ainda sem fonte                        | `null` nesta change                |
| `principalService` | ainda sem fonte                        | `null` nesta change                |

O `LocalDateTime` atual é coerente com a coluna
`TIMESTAMP WITHOUT TIME ZONE` criada por `V003`. Alterar para `Instant` seria
uma mudança de persistência/contrato separada.

## 12. Mapper completo

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/mapper/PatientMapper.java
```

### Como era

```java
@Mapping(target = "clinic", ignore = true)
@Mapping(target = "units", ignore = true)
@Mapping(target = "id", ignore = true)
@Mapping(target = "code", ignore = true)
@Mapping(target = "createdAt", ignore = true)
Patient toEntity(PatientRequestDTO dto);

default PatientResponseDTO toDto(Patient entity) {
    return new PatientResponseDTO(
            entity.getId(),
            entity.getName(),
            entity.getClinic().getId(),
            entity.getUnits().stream()
                    .map(ClinicUnit::getId)
                    .sorted()
                    .toList());
}
```

### Como deve ficar — arquivo completo

O worktree já contém esta estrutura. Preservar o código completo e apenas
validar/formar o arquivo:

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

### Uso sem fonte de serviço/status

```java
PatientResponseDTO response = patientMapper.toDto(patient);
```

Resultado:

```text
status = null
principalService = null
```

### Uso futuro, somente após resolução no service

```java
PatientResponseDTO response = patientMapper.toDto(
        patient,
        resolvedStatus,
        resolvedPrincipalService);
```

`resolvedStatus` e `resolvedPrincipalService` devem chegar prontos ao mapper.
O mapper não acessa contexto de segurança, repository ou API.

## 13. Interface do service

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/service/PatientServiceInt.java
```

### Como é hoje

```java
public interface PatientServiceInt {
    PageResponseDTO<PatientResponseDTO> findAllPatient(
            Pageable pageable,
            Authentication authentication);
}
```

A interface cobre apenas a listagem e não é usada pelo controller.

### Como deve ficar — arquivo completo

```java
package com.agendamento.smart.service;

import com.agendamento.smart.dtos.PageResponseDTO;
import com.agendamento.smart.dtos.patient.PatientRequestDTO;
import com.agendamento.smart.dtos.patient.PatientResponseDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

public interface PatientServiceInt {

    PageResponseDTO<PatientResponseDTO> findAllPatient(
            Pageable pageable,
            String name,
            Authentication authentication);

    PatientResponseDTO save(
            PatientRequestDTO dto,
            Authentication authentication);
}
```

### Explicação

- a assinatura registra o filtro de nome como parte explícita do use case;
- `save` deixa de existir apenas na classe concreta;
- o controller passa a depender do contrato;
- nenhuma abstração de status/serviço é adicionada antes da regra de domínio.

## 14. Repository

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/repository/PatientRepository.java
```

### Como é hoje

```java
Page<Patient> findAll(Pageable pageable);
Page<Patient> findAllByClinicId(UUID clinicId, Pageable pageable);
Page<Patient> findAllByClinicIdAndUnits_Id(
        UUID clinicId,
        UUID unitId,
        Pageable pageable);
```

Esses métodos aplicam escopo, mas não recebem nome. `findAll(Pageable)`
redeclara um método herdado e não deve ser usado em fluxo de tenant.

### Como deve ficar — arquivo completo

```java
package com.agendamento.smart.repository;

import com.agendamento.smart.model.patient.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {

    @Query(
            value = """
                    select p
                    from Patient p
                    where p.clinic.id = :clinicId
                      and (
                        :name is null
                        or lower(p.name) like lower(concat('%', :name, '%'))
                      )
                    """,
            countQuery = """
                    select count(p)
                    from Patient p
                    where p.clinic.id = :clinicId
                      and (
                        :name is null
                        or lower(p.name) like lower(concat('%', :name, '%'))
                      )
                    """)
    Page<Patient> findPageByClinicIdAndName(
            @Param("clinicId") UUID clinicId,
            @Param("name") String name,
            Pageable pageable);

    @Query(
            value = """
                    select distinct p
                    from Patient p
                    join p.units unit
                    where p.clinic.id = :clinicId
                      and unit.id = :unitId
                      and (
                        :name is null
                        or lower(p.name) like lower(concat('%', :name, '%'))
                      )
                    """,
            countQuery = """
                    select count(distinct p.id)
                    from Patient p
                    join p.units unit
                    where p.clinic.id = :clinicId
                      and unit.id = :unitId
                      and (
                        :name is null
                        or lower(p.name) like lower(concat('%', :name, '%'))
                      )
                    """)
    Page<Patient> findPageByClinicIdAndUnitIdAndName(
            @Param("clinicId") UUID clinicId,
            @Param("unitId") UUID unitId,
            @Param("name") String name,
            Pageable pageable);

    @Query("select max(p.code) from Patient p")
    Optional<Long> findMaxCode();

    Optional<Patient> findByName(String name);

    List<Patient> findAllByClinicId(UUID clinicId);

    @Query("""
            select distinct p
            from Patient p
            join p.units unit
            where p.clinic.id = :clinicId
              and unit.id = :unitId
            """)
    List<Patient> findAllByClinicIdAndUnitId(
            @Param("clinicId") UUID clinicId,
            @Param("unitId") UUID unitId);

    Optional<Patient> findByIdAndClinicId(UUID id, UUID clinicId);

    @Query("""
            select distinct p
            from Patient p
            left join fetch p.units
            where p.id = :id
              and p.clinic.id = :clinicId
            """)
    Optional<Patient> findByIdAndClinicIdWithUnits(
            @Param("id") UUID id,
            @Param("clinicId") UUID clinicId);

    @Query("""
            select distinct p
            from Patient p
            left join fetch p.units
            where p.id = :id
            """)
    Optional<Patient> findByIdWithUnits(@Param("id") UUID id);
}
```

### Explicação das queries

#### ADMIN

```sql
clinic_id = :clinicId
AND name contém :name, quando informado
```

Nenhuma consulta global é usada.

#### USER/BASIC

```sql
clinic_id = :clinicId
AND unit_id = :unitId
AND name contém :name, quando informado
```

`distinct` evita duplicar o paciente por causa do join com `units`; o
`countQuery` também usa `count(distinct p.id)` para manter os metadados da
página corretos.

#### Nome nulo

O service converte texto vazio em `null`. A condição `:name is null` faz a
mesma query representar listagem com e sem filtro, sem duplicar métodos.

#### Métodos preservados

Os métodos que retornam `List` continuam sendo usados por `CatalogService` e
os métodos de ID são usados pela agenda. Eles não devem ser removidos.

### Consideração de desempenho

`Patient.units` é lazy e o mapper lê a coleção. A transação read-only do
service mantém a sessão aberta durante o mapeamento. Isso pode gerar N+1 para
páginas grandes. Não aplicar `join fetch` de coleção diretamente com
paginação sem medir, porque Hibernate pode paginar em memória. Se a consulta
se tornar custosa, criar uma projeção paginada ou carregamento em duas etapas
em uma change de desempenho.

## 15. Service completo

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/service/PatientService.java
```

### Como era antes das últimas alterações

```java
if (dto.clinicId() != null && !dto.clinicId().equals(clinicId)) {
    throw new DomainException(...);
}
```

Não havia um helper `validateClinicId` e `USER` não recebia uma validação
explícita de unidade na criação.

### Como está no worktree

O worktree já contém:

```java
validateClinicId(dto.clinicId(), clinicId);

if (!unitScopeService.isAdmin(principal)) {
    UUID activeUnitId = unitScopeService.requireSingleAllowedUnitId(principal);
    if (!requestedUnitIds.equals(new LinkedHashSet<>(List.of(activeUnitId)))) {
        throw new DomainException("UNIT_ACCESS_DENIED", ...);
    }
}
```

Essa direção está correta. Ainda faltam o filtro de nome, a interface completa,
a transação read-only e uma defesa explícita para chamadas diretas ao service.

### Como deve ficar — arquivo completo

```java
package com.agendamento.smart.service;

import com.agendamento.smart.controller.exception.DomainException;
import com.agendamento.smart.controller.exception.PatientAlreadyExistsException;
import com.agendamento.smart.dtos.PageResponseDTO;
import com.agendamento.smart.dtos.patient.PatientRequestDTO;
import com.agendamento.smart.dtos.patient.PatientResponseDTO;
import com.agendamento.smart.mapper.PatientMapper;
import com.agendamento.smart.model.clinic.Clinic;
import com.agendamento.smart.model.patient.Patient;
import com.agendamento.smart.model.unit.ClinicUnit;
import com.agendamento.smart.model.user.User;
import com.agendamento.smart.repository.ClinicRepository;
import com.agendamento.smart.repository.PatientRepository;
import com.agendamento.smart.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService implements PatientServiceInt {

    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final UnitRepository unitRepository;
    private final PatientMapper patientMapper;
    private final UnitScopeService unitScopeService;

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<PatientResponseDTO> findAllPatient(
            Pageable pageable,
            String name,
            Authentication authentication) {
        User user = authenticatedUser(authentication);
        UUID clinicId = authenticatedClinicId(user);
        String normalizedName = normalizeNameFilter(name);

        Page<Patient> patientPage = unitScopeService.isAdmin(user)
                ? patientRepository.findPageByClinicIdAndName(
                        clinicId,
                        normalizedName,
                        pageable)
                : patientRepository.findPageByClinicIdAndUnitIdAndName(
                        clinicId,
                        unitScopeService.requireSingleAllowedUnitId(user),
                        normalizedName,
                        pageable);

        return PageResponseDTO.from(patientPage.map(patientMapper::toDto));
    }

    @Override
    @Transactional
    public PatientResponseDTO save(
            PatientRequestDTO dto,
            Authentication authentication) {
        User principal = authenticatedUser(authentication);
        UUID clinicId = authenticatedClinicId(principal);
        LinkedHashSet<UUID> requestedUnitIds = requestedUnitIds(dto);

        validateClinicId(dto.clinicId(), clinicId);
        validateUserUnitScope(principal, requestedUnitIds);

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(DomainException::tenantResourceNotFound);

        List<ClinicUnit> units = unitRepository.findAllByClinicIdAndIdIn(
                clinicId,
                requestedUnitIds);
        if (units.size() != requestedUnitIds.size()) {
            throw DomainException.tenantResourceNotFound();
        }

        String normalizedName = normalizePatientName(dto.name());
        if (patientRepository.findByName(normalizedName).isPresent()) {
            throw new PatientAlreadyExistsException(
                    "Já existe um paciente com esse nome.");
        }

        Patient patient = patientMapper.toEntity(dto);
        patient.setName(normalizedName);
        patient.setClinic(clinic);
        patient.setUnits(new LinkedHashSet<>(units));

        Patient persisted = patientRepository.saveAndFlush(patient);
        return patientMapper.toDto(persisted);
    }

    private User authenticatedUser(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof User user)) {
            throw new DomainException(
                    "AUTHENTICATION_REQUIRED",
                    "Usuário não autenticado.",
                    HttpStatus.UNAUTHORIZED);
        }
        return user;
    }

    private UUID authenticatedClinicId(User user) {
        if (user.getClinic() == null || user.getClinic().getId() == null) {
            throw DomainException.tenantResourceNotFound();
        }
        return user.getClinic().getId();
    }

    private LinkedHashSet<UUID> requestedUnitIds(PatientRequestDTO dto) {
        if (dto.unitIds() == null
                || dto.unitIds().isEmpty()
                || dto.unitIds().stream().anyMatch(Objects::isNull)) {
            throw new DomainException(
                    "VALIDATION_ERROR",
                    "Informe pelo menos uma unidade válida.",
                    HttpStatus.BAD_REQUEST);
        }

        return new LinkedHashSet<>(dto.unitIds());
    }

    private void validateClinicId(
            UUID requestedClinicId,
            UUID authenticatedClinicId) {
        if (requestedClinicId != null
                && !requestedClinicId.equals(authenticatedClinicId)) {
            throw new DomainException(
                    "CLINIC_ACCESS_DENIED",
                    "O clinicId informado não corresponde à clínica autenticada.",
                    HttpStatus.FORBIDDEN);
        }
    }

    private void validateUserUnitScope(
            User principal,
            LinkedHashSet<UUID> requestedUnitIds) {
        if (unitScopeService.isAdmin(principal)) {
            return;
        }

        UUID activeUnitId = unitScopeService
                .requireSingleAllowedUnitId(principal);
        LinkedHashSet<UUID> allowedUnitIds =
                new LinkedHashSet<>(List.of(activeUnitId));

        if (!requestedUnitIds.equals(allowedUnitIds)) {
            throw new DomainException(
                    "UNIT_ACCESS_DENIED",
                    "O usuário só pode cadastrar paciente na unidade associada.",
                    HttpStatus.FORBIDDEN);
        }
    }

    private String normalizePatientName(String name) {
        if (name == null || name.isBlank()) {
            throw new DomainException(
                    "VALIDATION_ERROR",
                    "Informe o nome do paciente.",
                    HttpStatus.BAD_REQUEST);
        }
        return name.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNameFilter(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return name.trim();
    }
}
```

### Ordem das validações no cadastro

```text
1. autenticação/principal
2. clínica do principal
3. unitIds estruturalmente válidos
4. clinicId legado compatível
5. limite de unidade do USER
6. existência de clínica
7. todas as unidades dentro da clínica
8. nome normalizado/duplicidade global
9. construção da entidade
10. persistência/flush
11. mapeamento do response
```

Validar tenant/unidade antes da duplicidade reduz o risco de usar o erro de
nome como canal para descobrir dados de outra clínica.

### Por que manter `saveAndFlush`

O flush garante que `@CreationTimestamp`, código gerado e constraints sejam
aplicados antes do mapper montar o response. Assim `code` e `createdAt` chegam
preenchidos no `201 Created`.

### Limite conhecido da duplicidade

`findByName` seguido de `saveAndFlush` não é seguro contra duas requisições
concorrentes, e a tabela não possui constraint de nome. A change atual preserva
essa regra. Não declarar que concorrência de nomes está resolvida.

## 16. Testes de integração do cadastro

### Arquivo atualizado

```text
src/test/java/com/agendamento/smart/controller/patient/PatientRegistrationControllerIntegrationTest.java
```

### Como é hoje

- três sucessos ainda esperam `200 OK`;
- não existe criação autenticada como `USER`;
- não existe tentativa de `USER` ampliar a unidade;
- os novos campos do response não são verificados;
- por isso, a expressão inválida de `@PreAuthorize` não estava protegida por
  teste atualizado.

### Como deve ficar — arquivo completo

```java
package com.agendamento.smart.controller.patient;

import com.agendamento.smart.PostgresIntegrationTestSupport;
import com.agendamento.smart.dtos.clinic.ClinicRegistrationRequest;
import com.agendamento.smart.dtos.clinic.ClinicRegistrationResponse;
import com.agendamento.smart.dtos.patient.PatientRequestDTO;
import com.agendamento.smart.infra.security.TokenService;
import com.agendamento.smart.model.patient.Patient;
import com.agendamento.smart.model.unit.ClinicUnit;
import com.agendamento.smart.model.unit.StatusUnit;
import com.agendamento.smart.model.unit.TypeUnit;
import com.agendamento.smart.model.user.User;
import com.agendamento.smart.model.user.UserRole;
import com.agendamento.smart.repository.PatientRepository;
import com.agendamento.smart.repository.UnitRepository;
import com.agendamento.smart.repository.UserRepository;
import com.agendamento.smart.service.ClinicOnboardingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PatientRegistrationControllerIntegrationTest
        extends PostgresIntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClinicOnboardingService onboardingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private TokenService tokenService;

    @Test
    void adminCreatesUppercasePatientUsingAuthenticatedClinic()
            throws Exception {
        Context context = clinic("one-unit");
        PatientRequestDTO request = new PatientRequestDTO(
                "Paciente Um",
                context.registration().clinicId(),
                List.of(context.registration().unitId()));

        String response = mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(context.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.code").isNumber())
                .andExpect(jsonPath("$.name").value("PACIENTE UM"))
                .andExpect(jsonPath("$.clinicId").value(
                        context.registration().clinicId().toString()))
                .andExpect(jsonPath("$.unitIds[0]").value(
                        context.registration().unitId().toString()))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.status").value(nullValue()))
                .andExpect(jsonPath("$.principalService").value(nullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        UUID patientId = UUID.fromString(
                objectMapper.readTree(response).get("id").asText());
        Patient persisted = patientRepository
                .findByIdWithUnits(patientId)
                .orElseThrow();

        assertThat(persisted.getClinic().getId())
                .isEqualTo(context.registration().clinicId());
        assertThat(persisted.getUnits())
                .extracting(ClinicUnit::getId)
                .containsExactly(context.registration().unitId());
    }

    @Test
    void adminCreatesPatientInTwoUnitsOfSameClinic() throws Exception {
        Context context = clinic("two-units");
        ClinicUnit branch = branch(context, "Filial");
        PatientRequestDTO request = new PatientRequestDTO(
                "Paciente Duas Unidades",
                null,
                List.of(context.registration().unitId(), branch.getId()));

        String response = mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(context.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.unitIds.length()").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString();

        UUID patientId = UUID.fromString(
                objectMapper.readTree(response).get("id").asText());
        Patient persisted = patientRepository
                .findByIdWithUnits(patientId)
                .orElseThrow();

        assertThat(persisted.getUnits())
                .extracting(ClinicUnit::getId)
                .containsExactlyInAnyOrder(
                        context.registration().unitId(),
                        branch.getId());
    }

    @Test
    void basicCreatesPatientOnlyInAssociatedUnit() throws Exception {
        Context context = clinic("basic-create");
        ClinicUnit matrix = unitRepository
                .findById(context.registration().unitId())
                .orElseThrow();
        ClinicUnit branch = branch(context, "Filial bloqueada");
        User basic = basic(context, matrix, "create");

        PatientRequestDTO allowed = new PatientRequestDTO(
                "Paciente Basic",
                null,
                List.of(matrix.getId()));

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(basic))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(allowed)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("PACIENTE BASIC"))
                .andExpect(jsonPath("$.unitIds[0]").value(
                        matrix.getId().toString()));

        PatientRequestDTO forbidden = new PatientRequestDTO(
                "Paciente Fora do Escopo",
                null,
                List.of(branch.getId()));

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(basic))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(forbidden)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("UNIT_ACCESS_DENIED"));

        assertThat(patientRepository.count()).isEqualTo(1);
    }

    @Test
    void rejectsEmptyUnitListAndForeignUnit() throws Exception {
        Context first = clinic("patient-first");
        Context second = clinic("patient-second");

        PatientRequestDTO empty = new PatientRequestDTO(
                "Sem Unidade",
                null,
                List.of());

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(first.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(empty)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.unitIds").isArray());

        PatientRequestDTO foreign = new PatientRequestDTO(
                "Unidade Alheia",
                null,
                List.of(second.registration().unitId()));

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(first.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(foreign)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(
                        "TENANT_RESOURCE_NOT_FOUND"));

        assertThat(patientRepository.count()).isZero();
    }

    @Test
    void rejectsLegacyClinicIdFromAnotherClinic() throws Exception {
        Context first = clinic("legacy-first");
        Context second = clinic("legacy-second");
        PatientRequestDTO request = new PatientRequestDTO(
                "Clinic Divergente",
                second.registration().clinicId(),
                List.of(first.registration().unitId()));

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(first.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(
                        "CLINIC_ACCESS_DENIED"));

        assertThat(patientRepository.count()).isZero();
    }

    @Test
    void keepsGlobalDuplicateNameRule() throws Exception {
        Context first = clinic("duplicate-patient-first");
        Context second = clinic("duplicate-patient-second");
        PatientRequestDTO firstRequest = new PatientRequestDTO(
                "Nome Global",
                null,
                List.of(first.registration().unitId()));

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(first.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(firstRequest)))
                .andExpect(status().isCreated());

        PatientRequestDTO duplicate = new PatientRequestDTO(
                "nome global",
                null,
                List.of(second.registration().unitId()));

        mockMvc.perform(post("/patient/save")
                        .header("Authorization", bearer(second.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(
                        "PATIENT_ALREADY_EXISTS"));

        assertThat(patientRepository.count()).isEqualTo(1);
    }

    @Test
    void rejectsAnonymousCreation() throws Exception {
        PatientRequestDTO request = new PatientRequestDTO(
                "Sem Autenticação",
                null,
                List.of(UUID.randomUUID()));

        mockMvc.perform(post("/patient/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden());

        assertThat(patientRepository.count()).isZero();
    }

    private Context clinic(String suffix) {
        ClinicRegistrationResponse registration = onboardingService.register(
                new ClinicRegistrationRequest(
                        new ClinicRegistrationRequest.ClinicData(
                                "Clínica " + suffix),
                        new ClinicRegistrationRequest.MatrixUnitData(
                                "Matriz " + suffix,
                                "America/Cuiaba"),
                        new ClinicRegistrationRequest.InitialProfessionalData(
                                "Atendente " + suffix,
                                "attendant-" + suffix + "@example.test",
                                "Attendant@123"),
                        new ClinicRegistrationRequest.InitialProfessionalData(
                                "Administrativo " + suffix,
                                "admin-" + suffix + "@example.test",
                                "Administrative@123")));
        User admin = userRepository
                .findById(registration.administrative().userId())
                .orElseThrow();
        return new Context(registration, admin);
    }

    private ClinicUnit branch(Context context, String name) {
        ClinicUnit unit = new ClinicUnit();
        unit.setId(UUID.randomUUID());
        unit.setClinic(context.admin().getClinic());
        unit.setTenantId(context.registration().clinicId());
        unit.setName(name);
        unit.setTimeZone("America/Cuiaba");
        unit.setStatus(StatusUnit.ATIVO);
        unit.setType(TypeUnit.FILIAL);
        return unitRepository.saveAndFlush(unit);
    }

    private User basic(
            Context context,
            ClinicUnit unit,
            String suffix) {
        User user = User.builder()
                .login("basic-patient-" + suffix + "@example.test")
                .password("not-used-by-token-test")
                .role(UserRole.USER)
                .clinic(context.admin().getClinic())
                .clinicUnit(unit)
                .build();
        return userRepository.saveAndFlush(user);
    }

    private String bearer(User user) {
        return "Bearer " + tokenService.generateToken(user);
    }

    private record Context(
            ClinicRegistrationResponse registration,
            User admin) {
    }
}
```

### O que estes testes protegem

- a expressão `hasAnyRole` funciona para ambos os papéis;
- o response é `201` e contém os campos reais;
- os campos sem fonte são nulos;
- `USER` não amplia a unidade;
- `ADMIN` usa várias unidades da própria clínica;
- clínica estrangeira e unidade estrangeira não persistem;
- validação produz `fieldErrors`;
- a duplicidade global permanece explícita;
- requisição anônima não cria paciente.

## 17. Testes de integração da listagem

### Arquivo novo

```text
src/test/java/com/agendamento/smart/controller/patient/PatientListingControllerIntegrationTest.java
```

### Intuito

Separar o contrato de leitura do contrato de criação e provar que paginação e
nome nunca ampliam o tenant/unidade. O teste também impede regressão para os
valores fixos do frontend.

### Código completo

```java
package com.agendamento.smart.controller.patient;

import com.agendamento.smart.PostgresIntegrationTestSupport;
import com.agendamento.smart.dtos.clinic.ClinicRegistrationRequest;
import com.agendamento.smart.dtos.clinic.ClinicRegistrationResponse;
import com.agendamento.smart.infra.security.TokenService;
import com.agendamento.smart.model.patient.Patient;
import com.agendamento.smart.model.unit.ClinicUnit;
import com.agendamento.smart.model.unit.StatusUnit;
import com.agendamento.smart.model.unit.TypeUnit;
import com.agendamento.smart.model.user.User;
import com.agendamento.smart.model.user.UserRole;
import com.agendamento.smart.repository.PatientRepository;
import com.agendamento.smart.repository.UnitRepository;
import com.agendamento.smart.repository.UserRepository;
import com.agendamento.smart.service.ClinicOnboardingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PatientListingControllerIntegrationTest
        extends PostgresIntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClinicOnboardingService onboardingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private TokenService tokenService;

    @Test
    void adminListsOnlyOwnClinicWithRealPagination() throws Exception {
        Context own = clinic("list-own");
        Context foreign = clinic("list-foreign");
        ClinicUnit ownMatrix = matrix(own);
        ClinicUnit foreignMatrix = matrix(foreign);

        patient(own, ownMatrix, "ANA PACIENTE");
        patient(own, ownMatrix, "BIA PACIENTE");
        patient(foreign, foreignMatrix, "PACIENTE ESTRANGEIRO");

        mockMvc.perform(get("/patient/list")
                        .header("Authorization", bearer(own.admin()))
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.last").value(false))
                .andExpect(jsonPath("$.content[0].code").isNumber())
                .andExpect(jsonPath("$.content[0].createdAt").isNotEmpty())
                .andExpect(jsonPath("$.content[0].status").value(nullValue()))
                .andExpect(jsonPath("$.content[0].principalService")
                        .value(nullValue()));

        mockMvc.perform(get("/patient/list")
                        .header("Authorization", bearer(own.admin()))
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    void filtersNameInsideAuthenticatedClinic() throws Exception {
        Context context = clinic("name-filter");
        ClinicUnit matrix = matrix(context);
        patient(context, matrix, "ANA OLIVEIRA");
        patient(context, matrix, "BRUNO SANTOS");

        mockMvc.perform(get("/patient/list")
                        .header("Authorization", bearer(context.admin()))
                        .param("name", " ana ")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name")
                        .value("ANA OLIVEIRA"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void basicListsOnlyPatientsFromAssociatedUnit() throws Exception {
        Context context = clinic("basic-list");
        ClinicUnit matrix = matrix(context);
        ClinicUnit branch = branch(context, "Filial Basic");
        User basic = basic(context, branch, "list");

        patient(context, matrix, "PACIENTE MATRIZ");
        Patient allowed = patient(context, branch, "PACIENTE FILIAL");

        mockMvc.perform(get("/patient/list")
                        .header("Authorization", bearer(basic))
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id")
                        .value(allowed.getId().toString()))
                .andExpect(jsonPath("$.content[0].name")
                        .value("PACIENTE FILIAL"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void basicNameFilterDoesNotEscapeUnitScope() throws Exception {
        Context context = clinic("basic-filter");
        ClinicUnit matrix = matrix(context);
        ClinicUnit branch = branch(context, "Filial Filtro");
        User basic = basic(context, branch, "filter");

        patient(context, matrix, "ANA FORA DA UNIDADE");
        patient(context, branch, "BRUNO NA UNIDADE");

        mockMvc.perform(get("/patient/list")
                        .header("Authorization", bearer(basic))
                        .param("name", "ANA")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void rejectsAnonymousListing() throws Exception {
        mockMvc.perform(get("/patient/list"))
                .andExpect(status().isForbidden());
    }

    private Context clinic(String suffix) {
        ClinicRegistrationResponse registration = onboardingService.register(
                new ClinicRegistrationRequest(
                        new ClinicRegistrationRequest.ClinicData(
                                "Clínica " + suffix),
                        new ClinicRegistrationRequest.MatrixUnitData(
                                "Matriz " + suffix,
                                "America/Cuiaba"),
                        new ClinicRegistrationRequest.InitialProfessionalData(
                                "Atendente " + suffix,
                                "attendant-" + suffix + "@example.test",
                                "Attendant@123"),
                        new ClinicRegistrationRequest.InitialProfessionalData(
                                "Administrativo " + suffix,
                                "admin-" + suffix + "@example.test",
                                "Administrative@123")));
        User admin = userRepository
                .findById(registration.administrative().userId())
                .orElseThrow();
        return new Context(registration, admin);
    }

    private ClinicUnit matrix(Context context) {
        return unitRepository
                .findById(context.registration().unitId())
                .orElseThrow();
    }

    private ClinicUnit branch(Context context, String name) {
        ClinicUnit unit = new ClinicUnit();
        unit.setId(UUID.randomUUID());
        unit.setClinic(context.admin().getClinic());
        unit.setTenantId(context.registration().clinicId());
        unit.setName(name);
        unit.setTimeZone("America/Cuiaba");
        unit.setStatus(StatusUnit.ATIVO);
        unit.setType(TypeUnit.FILIAL);
        return unitRepository.saveAndFlush(unit);
    }

    private User basic(
            Context context,
            ClinicUnit unit,
            String suffix) {
        User user = User.builder()
                .login("basic-list-" + suffix + "@example.test")
                .password("not-used-by-token-test")
                .role(UserRole.USER)
                .clinic(context.admin().getClinic())
                .clinicUnit(unit)
                .build();
        return userRepository.saveAndFlush(user);
    }

    private Patient patient(
            Context context,
            ClinicUnit unit,
            String name) {
        Patient patient = new Patient();
        patient.setName(name);
        patient.setClinic(context.admin().getClinic());
        patient.setUnits(new LinkedHashSet<>(List.of(unit)));
        return patientRepository.saveAndFlush(patient);
    }

    private String bearer(User user) {
        return "Bearer " + tokenService.generateToken(user);
    }

    private record Context(
            ClinicRegistrationResponse registration,
            User admin) {
    }
}
```

### O que não testar como entregue

Não adicionar testes que esperem filtragem por `status` ou `serviceId` até que
o domínio forneça essas informações. Um teste que apenas confirme que o
parâmetro é aceito, mas não altera o resultado, legitimaria o bug observado.

## 18. Testes existentes preservados

`BasicUnitScopeIntegrationTest` já comprova que `GET /patient/list` de um
`USER` fica limitado à unidade associada e que visitante recebe 403. Ele deve
continuar passando. Não remover esses asserts ao criar o teste específico da
listagem.

Os testes de agenda que usam:

```java
PatientRepository.findByIdAndClinicIdWithUnits(...)
```

também precisam permanecer verdes, porque o repository continua sendo
compartilhado pela criação de agendamentos.

## 19. Banco de dados e migrations

### Nenhuma migration é necessária para o alvo mínimo

`V003__create_table_patient.sql` já contém:

```sql
CREATE TABLE PATIENT (
    id UUID NOT NULL,
    code BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL
        DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    clinic_id UUID NOT NULL,

    CONSTRAINT pk_patient PRIMARY KEY (id),
    CONSTRAINT uk_patient_code UNIQUE (code),
    CONSTRAINT uk_patient_clinic_id UNIQUE (clinic_id, id),
    CONSTRAINT fk_patient_clinic
        FOREIGN KEY (clinic_id)
        REFERENCES CLINIC (id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);

CREATE INDEX idx_patient_clinic_name ON PATIENT (clinic_id, name);
```

`V010__add_clinic_structure_and_unit_links.sql` já contém a tabela associativa
e o trigger de mesma clínica:

```sql
CREATE TABLE PATIENT_UNIT (
    patient_id UUID NOT NULL,
    unit_id UUID NOT NULL,

    CONSTRAINT pk_patient_unit PRIMARY KEY (patient_id, unit_id),
    CONSTRAINT fk_patient_unit_patient
        FOREIGN KEY (patient_id)
        REFERENCES PATIENT (id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT fk_patient_unit_unit
        FOREIGN KEY (unit_id)
        REFERENCES CLINIC_UNIT (id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);
```

```sql
CREATE FUNCTION enforce_patient_unit_same_clinic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    patient_clinic_id UUID;
    unit_clinic_id UUID;
BEGIN
    SELECT clinic_id INTO patient_clinic_id
    FROM PATIENT
    WHERE id = NEW.patient_id;

    SELECT clinic_id INTO unit_clinic_id
    FROM CLINIC_UNIT
    WHERE id = NEW.unit_id;

    IF patient_clinic_id IS DISTINCT FROM unit_clinic_id THEN
        RAISE EXCEPTION 'Paciente e unidade devem pertencer à mesma clínica'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END
$$;
```

O índice `idx_patient_clinic_name` ajuda a restrição obrigatória por clínica. A
busca `contains` pode não aproveitar integralmente um índice B-tree por causa
do wildcard inicial. Só adicionar extensão/índice trigram com medição e change
de desempenho própria.

### Quando uma migration será necessária

Uma migration nova será obrigatória se uma decisão futura adicionar:

- status persistido do paciente;
- relação explícita de serviço principal;
- unicidade de nome/CPF por clínica;
- atualização/autoria do paciente;
- CPF/telefone do contrato futuro.

Não editar migrations versionadas já aplicadas para alcançar esses objetivos.

## 20. Gate OpenSpec do backend

O repositório backend exige uma change local antes de alterar contrato HTTP,
autorização ou comportamento. A change frontend não substitui automaticamente
esse gate em outro repositório.

Antes de implementar o código deste guia, criar no backend uma change, por
exemplo:

```text
modernizar-pacientes-e-permitir-cadastro-basic
```

Ela deve conter no mínimo:

```text
openspec/changes/modernizar-pacientes-e-permitir-cadastro-basic/
├── proposal.md
├── design.md
├── specs/
│   └── patients/
│       └── spec.md
└── tasks.md
```

### Delta mínimo que a spec backend deve registrar

```md
## MODIFIED Requirements

### Requirement: Cadastro de paciente por ADMIN e USER

`POST /patient/save` MUST exigir autenticação e aceitar `ADMIN` e `USER`. A
clínica MUST ser derivada do principal. `unitIds` MUST ser não vazio. `ADMIN`
MUST usar somente unidades da própria clínica; `USER` MUST usar exatamente sua
unidade associada. Sucesso MUST responder HTTP 201.

#### Scenario: ADMIN cadastra em unidades da clínica

- **WHEN** ADMIN envia nome e uma ou mais unidades da clínica autenticada
- **THEN** o paciente é criado nessa clínica e nessas unidades com HTTP 201

#### Scenario: USER cadastra na unidade associada

- **WHEN** USER envia nome e exatamente sua unidade associada
- **THEN** o paciente é criado na clínica/unidade efetiva com HTTP 201

#### Scenario: USER amplia escopo

- **WHEN** USER envia unidade diferente da associação
- **THEN** a API responde `UNIT_ACCESS_DENIED` sem persistir paciente

### Requirement: Resposta paginada contém dados reais

`GET /patient/list` MUST retornar código, nome, clínica, unidades e data de
cadastro reais. Status e serviço principal MUST permanecer ausentes/nulos
enquanto não houver fonte de domínio.

#### Scenario: Campo sem fonte

- **WHEN** paciente não possui status ou serviço principal resolvido
- **THEN** a API retorna `null` e não fabrica valor de apresentação

### Requirement: Listagem aceita filtro por nome sem ampliar escopo

`GET /patient/list` MUST aceitar `name` opcional e combiná-lo com clínica e
unidade efetivas.

#### Scenario: ADMIN filtra nome

- **WHEN** ADMIN pesquisa nome
- **THEN** recebe somente correspondências da própria clínica

#### Scenario: USER filtra nome

- **WHEN** USER pesquisa nome
- **THEN** recebe somente correspondências da unidade associada
```

### Regra para status e serviço

A spec backend não deve prometer filtros `status`/`serviceId` nesta change. Se
a equipe decidir implementá-los, deve primeiro adicionar requisitos e decisões
de origem dos dados, depois atualizar tarefas, código e frontend.

### Validação do gate

```bash
PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH \
  openspec validate modernizar-pacientes-e-permitir-cadastro-basic --strict
```

Somente depois dessa validação iniciar alterações Java.

## 21. README do controller de pacientes

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/controller/patient/README.md
```

### Como é hoje

O README afirma simultaneamente que criação é exclusiva de `ADMIN`, que ambos
os papéis deveriam cadastrar, que o DTO não possui constraints e que pacientes
não pertencem a unidades. Essas afirmações contradizem o código e o schema.

### Como deve ficar — arquivo completo

````md
# Controller de pacientes

## Objetivo

Expor criação e listagem paginada de pacientes com clínica e unidade derivadas
da identidade autenticada.

## Endpoints

### `GET /patient/list`

- exige `ADMIN` ou `USER`;
- aceita `page`, `size`, `sort` e `name` opcional;
- `ADMIN` recebe somente pacientes da própria clínica;
- `USER` recebe somente pacientes de sua unidade associada;
- responde `PageResponseDTO<PatientResponseDTO>`.

### `POST /patient/save`

- exige `ADMIN` ou `USER`;
- recebe `name`, `unitIds` não vazio e `clinicId` legado opcional;
- deriva a clínica da sessão;
- `ADMIN` pode usar unidades da própria clínica;
- `USER` usa exatamente sua unidade associada;
- responde HTTP 201 com `PatientResponseDTO`.

## Fluxos

```text
Controller → PatientServiceInt → PatientService → repositories/mapper
```

A autorização de papel no controller não substitui a validação de tenant e
unidade no service.

## Erros principais

| Código                      | Situação                                |
| --------------------------- | --------------------------------------- |
| `VALIDATION_ERROR`          | nome ou unidades inválidos              |
| `CLINIC_ACCESS_DENIED`      | `clinicId` legado divergente            |
| `UNIT_ACCESS_DENIED`        | USER solicita outra unidade             |
| `TENANT_RESOURCE_NOT_FOUND` | clínica/unidade fora do escopo          |
| `PATIENT_ALREADY_EXISTS`    | nome duplicado pela regra legada global |

## Limites

- status e serviço principal são nulos enquanto não houver fonte de domínio;
- apenas o filtro por nome é suportado;
- edição, desativação e detalhe não possuem endpoint;
- as rotas legadas conservam `/patient/list` e `/patient/save` por
  compatibilidade.
````

## 22. README dos DTOs de paciente

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/dtos/patient/README.md
```

### Como deve ficar — arquivo completo

````md
# DTOs de paciente

## Contratos

### `PatientRequestDTO`

- `name`: obrigatório, não vazio, até 255 caracteres;
- `clinicId`: opcional e somente para compatibilidade;
- `unitIds`: lista obrigatória, não vazia e sem UUID nulo.

O `clinicId` não define o tenant; o service usa a clínica autenticada.

### `PatientResponseDTO`

- `id`: UUID do paciente;
- `code`: código persistido;
- `name`: nome normalizado;
- `clinicId`: clínica efetiva;
- `unitIds`: vínculos persistidos em ordem determinística;
- `createdAt`: timestamp persistido;
- `status`: nulo enquanto não existir regra de domínio;
- `principalService`: nulo enquanto não existir regra de resolução.

### `PrincipalServiceResponse`

Projeção opcional com `id` e `name`. O record não escolhe nem consulta o
serviço principal.

## Fluxo

```text
JSON → PatientRequestDTO → PatientService → Patient → PatientMapper
     → PatientResponseDTO → JSON
```

## Regras

- relações de clínica/unidade não são confiadas ao mapper;
- nome é normalizado no service;
- ausência de status/serviço é representada por `null`;
- entidade JPA não é exposta no contrato;
- o nome permanece único globalmente por compatibilidade nesta change.

## Evolução

Remover `clinicId` do request somente após migrar clientes legados. Status,
serviço principal, CPF, telefone, edição e inativação exigem changes próprias.
````

## 23. README do mapper

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/mapper/README.md
```

### Trechos atuais que ficam desatualizados

```md
- `PatientMapper`: ignora clínica na entrada e extrai `clinic.id` na saída.
```

Essa descrição não cobre código, data, unidades ordenadas nem a sobrecarga
opcional.

### Como deve ficar — bloco de paciente

```md
## PatientMapper

`PatientMapper.toEntity` converte somente os campos simples do request e ignora
`id`, `code`, `createdAt`, `clinic` e `units`. O `PatientService` resolve e
atribui relações e campos controlados pelo servidor.

`PatientMapper.toDto(Patient)` devolve ID, código, nome, clínica, unidades
ordenadas e data reais, delegando para a sobrecarga completa com `status` e
`principalService` nulos.

`PatientMapper.toDto(Patient, String, PrincipalServiceResponse)` somente
transporta status/serviço que já tenham sido resolvidos por uma regra de
domínio. O mapper não consulta repositories, segurança ou APIs.

Unidades nulas são convertidas em lista vazia de forma defensiva. Entidades
persistidas válidas continuam obrigadas a possuir pelo menos uma unidade.
```

Na seção de débitos, acrescentar:

```md
- status e serviço principal do paciente ainda não possuem fonte de domínio;
- o mapeamento de unidades lazy pode gerar N+1 em páginas grandes e deve ser
  medido antes de qualquer otimização com fetch de coleção paginada.
```

## 24. README do modelo de paciente

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/model/patient/README.md
```

### Como deve ficar — arquivo completo

```md
# Modelo de paciente

## Objetivo

Representar um paciente pertencente a exatamente uma clínica e vinculado a uma
ou mais unidades dessa mesma clínica.

## Campos e relações

- `id`: UUID gerado pelo provedor JPA;
- `code`: código global único gerado antes da persistência;
- `name`: nome persistido e normalizado pelo service;
- `createdAt`: timestamp de criação;
- `clinic`: relação obrigatória `ManyToOne`;
- `units`: relação `ManyToMany` pela tabela `PATIENT_UNIT`.

## Invariantes

- o service deriva a clínica do usuário autenticado;
- unidades são consultadas por `clinicId` antes da associação;
- o banco possui trigger que rejeita paciente/unidade de clínicas diferentes;
- `USER` cadastra somente em sua unidade associada;
- `ADMIN` pode cadastrar em uma ou mais unidades da própria clínica.

## Campos não existentes

O modelo não possui status de paciente nem serviço principal. Status de
agendamento não deve ser copiado para o paciente sem regra aprovada. O response
usa `null` para esses campos.

## Débitos conhecidos

- nome duplicado é verificado globalmente apenas no service;
- não há constraint de nome nem proteção de concorrência para duplicidade;
- geração por `MAX(code) + 1` pode competir sob escritas simultâneas;
- não existem CPF, telefone, atualização, autoria ou inativação;
- `units` lazy pode produzir N+1 durante listagem.
```

## 25. README de repositories

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/repository/README.md
```

### Substituir a responsabilidade antiga

Como era:

```md
- Paginação de pacientes.
```

Como deve ficar:

```md
- Paginação de pacientes sempre escopada por clínica e, para USER, unidade,
  com filtro opcional case-insensitive por nome.
```

### Acrescentar ao fluxo de pacientes

```md
## Consultas de paciente

- `findPageByClinicIdAndName`: página do ADMIN dentro da clínica;
- `findPageByClinicIdAndUnitIdAndName`: página do USER dentro da clínica e
  unidade associada;
- `findAllByClinicId`/`findAllByClinicIdAndUnitId`: catálogos reduzidos da
  agenda;
- `findByIdAndClinicIdWithUnits`: validação de paciente na agenda;
- `findByName`: duplicidade global legada;
- `findMaxCode`: geração de código legada.

Nenhum fluxo de negócio deve usar `findAll(Pageable)` global. Status e serviço
principal não possuem query porque não existem no domínio atual.
```

### Atualizar os débitos

```md
- `findByName` continua global e sem constraint equivalente;
- `findMaxCode` continua sujeito a concorrência;
- busca `contains` com wildcard inicial deve ser medida antes de criar índice
  especializado;
- mapeamento das unidades lazy pode gerar N+1 na listagem paginada.
```

## 26. README de services

### Arquivo atualizado

```text
src/main/java/com/agendamento/smart/service/README.md
```

### Substituir o fluxo de paciente por

```md
## Fluxo de pacientes

### Listagem

1. valida o principal autenticado;
2. deriva a clínica;
3. normaliza o filtro opcional de nome;
4. ADMIN consulta clínica + nome;
5. USER consulta clínica + unidade associada + nome;
6. mapeia dentro de transação read-only;
7. devolve `PageResponseDTO`.

### Cadastro

1. valida autenticação, clínica e `unitIds`;
2. rejeita `clinicId` legado divergente por `validateClinicId`;
3. limita USER à unidade associada;
4. resolve todas as unidades dentro da clínica;
5. normaliza nome e aplica duplicidade global legada;
6. persiste/flush paciente e vínculos;
7. devolve código/data reais e campos opcionais nulos.
```

### Remover débitos que já não são verdadeiros

Remover:

```md
- `PatientService` não filtra por clínica do usuário.
- `PatientService` lança `com.sun.jdi.request.DuplicateRequestException`.
- Não existem testes dos services.
```

### Manter/registrar débitos reais

```md
- duplicidade de nome é global, sem constraint e vulnerável a corrida;
- geração de código por máximo atual é vulnerável a concorrência;
- status e serviço principal não possuem fonte de domínio;
- filtros de status e serviço ainda não são suportados;
- `UserService.currentUserService` continua ignorando o parâmetro recebido;
- paginação pode disparar N+1 ao mapear unidades lazy.
```

## 27. Documentação de arquitetura e objetivo

### `docs/ARQUITETURA_DO_SISTEMA.md`

Esse documento descreve estado implementado e contém informações antigas.
Atualizar somente depois do código/testes.

#### Tabela de endpoints — como deve ficar

```md
| `GET /patient/list` | Lista paginada por clínica/unidade, com nome opcional | JWT + `ADMIN` ou `USER` |
| `POST /patient/save` | Cria paciente na clínica autenticada e unidades autorizadas | JWT + `ADMIN` ou `USER` |
```

#### Fluxo de pacientes — como deve ficar

```md
### Cadastro e consulta de pacientes

1. `PatientController` exige `ADMIN` ou `USER`.
2. `PatientService` deriva a clínica e resolve o escopo de unidade da sessão.
3. `USER` cadastra/lista somente na unidade associada; `ADMIN` opera nas
   unidades da própria clínica.
4. O nome é normalizado no cadastro e pode ser usado como filtro parcial na
   listagem.
5. Paciente e `PATIENT_UNIT` são persistidos na mesma transação.
6. Código e data vêm da entidade; status e serviço principal permanecem nulos
   sem regra de domínio.
7. A resposta paginada usa `PageResponseDTO`.
```

Remover as afirmações de listagem pública/global e de criação exclusiva por
`ADMIN`.

### `docs/OBJETIVO_DO_SISTEMA.md`

#### Atores — como deve ficar

```md
| Cliente não autenticado | Efetuar login e cadastrar inicialmente uma clínica |
| Usuário `USER` autenticado | Consultar cadastros permitidos e cadastrar paciente somente na unidade associada |
| Usuário `ADMIN` autenticado | Cadastrar/listar pacientes em unidades da própria clínica |
```

#### Cadastro de paciente — como deve ficar

```md
### Cadastro de paciente

Entrada: nome e lista não vazia de unidades.

1. A rota exige `ADMIN` ou `USER`.
2. A clínica é derivada do principal autenticado.
3. `USER` usa exatamente sua unidade associada.
4. `ADMIN` usa uma ou mais unidades da própria clínica.
5. O nome é normalizado e mantém a duplicidade global legada.
6. Paciente e associações são persistidos atomicamente.

Resultado: HTTP 201 com UUID, código, nome, clínica, unidades, data e campos
opcionais nulos quando não houver fonte.
```

#### Listagem — como deve ficar

```md
### Listagem de pacientes

Entrada: `page`, `size`, `sort` e `name` opcional.

1. A rota exige autenticação.
2. ADMIN consulta somente a própria clínica.
3. USER consulta somente a unidade associada.
4. O nome é aplicado dentro desse escopo.
5. A resposta contém conteúdo e metadados reais de paginação.
```

Na matriz de funcionalidades, substituir “listagem paginada legada” por
“listagem autenticada e escopada com filtro por nome”.

### `docs/REQUISITOS_DO_MVP.md`

Não precisa ser alterado para papéis: ele já afirma que `ADMIN` e `BASIC`
podem cadastrar pacientes e que `BASIC` corresponde ao enum persistido `USER`.

## 28. Alinhamento obrigatório com o frontend

O guia frontend contém código para filtros de nome, status e serviço, mas
registra explicitamente que status/serviço só podem ser ativados se o backend
os suportar.

Com o alvo seguro deste guia, o frontend deve:

```text
enviar: page, size, name
não enviar: status, serviceId
```

E deve:

- manter `status` e `principalService` opcionais/anuláveis no TypeScript;
- renderizar `—` para ambos quando nulos;
- ocultar ou desabilitar os selects de status/serviço, sem chamá-los de
  filtros funcionais;
- continuar usando cores na estrutura, cabeçalho, botões, foco e estados;
- ativar chips coloridos somente quando a API devolver status real.

Contrato de criação compartilhado:

```json
{
  "name": "Beatriz",
  "unitIds": ["<active-unit-id-ou-seleção-admin>"]
}
```

O frontend não envia `clinicId`; a compatibilidade desse campo existe apenas
para clientes antigos.

## 29. Validações executadas durante a elaboração

### 29.1 CodeGraph

O índice backend estava utilizável e informou:

```text
Files: 109
Nodes: 1.835
Edges: 3.176
```

Também informou mudanças pendentes no índice. As leituras usadas neste guia
foram feitas do código atual em disco, não apenas de símbolos antigos.

Blast radius relevante:

- `PatientMapper.toDto` é chamado por `PatientService`;
- listagens de paciente alimentam também `CatalogService`;
- `findByIdAndClinicIdWithUnits` é usado por `AppointmentService`;
- alterações em `PatientRepository` exigem regressão da agenda.

### 29.2 API local

Resultados observados em `http://localhost:8080`:

```text
GET /patient/list anônimo → 403
GET /patient/list ADMIN   → 200, envelope paginado
GET /patient/list BASIC   → 200, envelope paginado
GET /auth/me ADMIN        → 200, activeUnitId presente
GET /auth/me BASIC        → 200, activeUnitId presente
```

Estrutura dos itens:

```text
clinicId, code, createdAt, id, name, principalService, status, unitIds
```

Campos sem fonte:

```text
status = null
principalService = null
```

Filtros não implementados na instância atual:

```text
total sem filtro           = 6
total com nome impossível  = 6
total com status impossível = 6
total com serviço impossível = 6
```

Probe de autorização sem mutação:

```text
ADMIN duplicate probe → 400 INVALID_REQUEST
BASIC duplicate probe → 400 INVALID_REQUEST
contagens antes/depois → inalteradas
```

Causa retornada pela API:

```text
Failed to evaluate expression 'hasRole('ADMIN', 'USER')'
```

### 29.3 Compilação local

A tentativa de:

```bash
./mvnw -q -DskipTests compile
```

foi bloqueada pelo ambiente da sessão:

```text
The JAVA_HOME environment variable is not defined correctly
```

Isso não é evidência de erro Java nem de build aprovado. A API em execução
confirma que uma versão com os novos campos está carregada, mas a implementação
final ainda precisa ser compilada com JDK 21 configurado.

### 29.4 Auditoria editorial final

A normalização e a auditoria final deste guia confirmaram:

- formatação integral aceita pelo Prettier;
- change `modernizar-listagem-e-vincular-pacientes` válida em modo estrito;
- todas as cercas Markdown balanceadas, inclusive os blocos Markdown que
  contêm exemplos cercados internos;
- links relativos para os guias geral e frontend existentes;
- caminhos dos arquivos atuais conferidos no repositório backend;
- `PrincipalServiceResponse.java` corretamente classificado como arquivo novo
  já presente no worktree, e o teste de listagem como novo arquivo planejado;
- assinatura `Controller → PatientServiceInt → PatientService` coerente para
  `findAllPatient(Pageable, String, Authentication)`;
- nomes dos métodos chamados pelo service iguais aos declarados no repository;
- os oito argumentos construídos pelo mapper na mesma ordem dos oito campos de
  `PatientResponseDTO`;
- expressão inválida `hasRole('ADMIN', 'USER')` mantida somente nos trechos de
  diagnóstico/código atual, enquanto todo código-alvo usa `hasAnyRole`;
- filtros `status` e `serviceId` registrados apenas como evolução adiada;
- ausência de placeholders ou trechos omitidos nos blocos marcados como
  arquivo completo.

A compilação Java não foi repetida nesta auditoria. Ela permanece explicitamente
bloqueada pela ausência de `JAVA_HOME` válido na sessão e deverá ser executada
com JDK 21 durante a implementação.

## 30. Comandos de implementação e verificação

### 30.1 Preparação segura

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/api-agendamento-smart-api/agendamento-smart-api
git status --short
PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH codegraph status
```

Não executar `git reset`, `checkout` ou limpeza sobre os cinco arquivos já
modificados.

### 30.2 Localização de impacto

```bash
PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH \
  codegraph impact "PatientService"

PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH \
  codegraph impact "PatientRepository"
```

Depois das alterações:

```bash
git diff --name-only | \
  PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH \
  codegraph affected --stdin
```

### 30.3 Compilação

Configurar JDK 21:

```bash
export JAVA_HOME=<caminho-do-jdk-21>
export PATH="$JAVA_HOME/bin:$PATH"
java -version
./mvnw -q -DskipTests compile
```

O resultado precisa ser `BUILD SUCCESS`. Verificar também a implementação
MapStruct gerada em `target/generated-sources/annotations` apenas para
diagnóstico; não editar arquivos gerados.

### 30.4 Testes direcionados

Os testes usam Testcontainers/PostgreSQL 18 e exigem Docker funcional:

```bash
./mvnw \
  -Dtest=PatientRegistrationControllerIntegrationTest,PatientListingControllerIntegrationTest,BasicUnitScopeIntegrationTest \
  test
```

Depois executar regressão dos consumidores do repository:

```bash
./mvnw \
  -Dtest=AppointmentCreationStructureRulesIntegrationTest,AppointmentReadStatusIntegrationTest \
  test
```

### 30.5 Suíte completa

```bash
./mvnw clean verify
```

Não marcar tarefas como concluídas se Testcontainers, Docker ou JDK impedirem
a execução. Registrar o bloqueio real.

### 30.6 Verificações SQL sem dados pessoais

Executar em ambiente de teste/homologação:

```sql
-- Pacientes sem unidade: esperado 0.
SELECT COUNT(*) AS patients_without_unit
FROM patient patient
WHERE NOT EXISTS (
    SELECT 1
    FROM patient_unit link
    WHERE link.patient_id = patient.id
);

-- Vínculos cruzando clínica: esperado 0.
SELECT COUNT(*) AS cross_clinic_links
FROM patient_unit link
JOIN patient ON patient.id = link.patient_id
JOIN clinic_unit unit ON unit.id = link.unit_id
WHERE patient.clinic_id <> unit.clinic_id;
```

Essas consultas retornam somente contagens.

### 30.7 Validação HTTP após implementação

Use variáveis locais, sem registrar token em log:

```bash
export API_BASE_URL=http://localhost:8080
export API_LOGIN='<login-de-teste>'
export API_PASSWORD='<senha-de-teste>'

token="$({
  jq -nc \
    --arg login "$API_LOGIN" \
    --arg password "$API_PASSWORD" \
    '{login:$login,password:$password}'
} | curl -sS \
      -X POST \
      -H 'Content-Type: application/json' \
      --data-binary @- \
      "$API_BASE_URL/auth/login" | jq -r '.token')"

curl -sS \
  -H "Authorization: Bearer $token" \
  "$API_BASE_URL/patient/list?page=0&size=5&name=Ana" | \
  jq '{page,size,totalElements,totalPages,last,itemKeys:(.content[0] // {} | keys)}'
```

Não imprimir o token nem o conteúdo integral da lista em logs compartilhados.

Validar criação somente em banco descartável usando um nome exclusivo e
unidade autorizada. Confirmar:

```text
ADMIN válido  → 201
USER válido   → 201
USER outra unidade → 403 UNIT_ACCESS_DENIED
unidade externa → 404 TENANT_RESOURCE_NOT_FOUND
duplicado → 409 PATIENT_ALREADY_EXISTS
```

### 30.8 OpenSpec

Backend, após criar a change local:

```bash
PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH \
  openspec validate modernizar-pacientes-e-permitir-cadastro-basic --strict
```

Frontend/coordenador:

```bash
cd /home/abmael/workspace/01-MEUS-PROJETOS-OFICIAIS-PRD-TEST/5-agendamentos-smart/agendamento-smart-web/agendamentos-smart
PATH=/home/abmael/.nvm/versions/node/v22.14.0/bin:$PATH \
  openspec validate modernizar-listagem-e-vincular-pacientes --strict
```

## 31. Ordem de rollout

1. criar/validar a change backend;
2. implementar API e testes;
3. implantar API com campos adicionais e criação `ADMIN`/`USER`;
4. verificar `201`, tenant, unidade e filtro por nome;
5. ajustar frontend para não enviar status/serviço nesta etapa;
6. implantar frontend modernizado;
7. monitorar `400 INVALID_REQUEST`, `403`, `404` e `409` sem registrar payloads
   sensíveis;
8. somente depois marcar tarefas e sincronizar specs.

Campos novos no response são aditivos, mas a mudança de `200` para `201` e a
autorização de `USER` devem ser coordenadas com testes/clientes.

### Rollback

- reverter a composição frontend se necessário;
- manter validações de tenant/unidade no backend;
- não remover `PATIENT_UNIT` nem triggers;
- não editar migrations aplicadas;
- uma versão anterior que espera quatro campos de response geralmente ignora
  campos adicionais, mas confirmar os consumidores;
- se o frontend depender de `201`, alinhar o rollback do contrato HTTP.

## 32. Checklist de aceite do backend

- [ ] existe change OpenSpec no repositório backend;
- [ ] `@PreAuthorize` usa `hasAnyRole('ADMIN', 'USER')`;
- [ ] não existe `hasRole('ADMIN', 'USER')`;
- [ ] `POST /patient/save` responde `201`;
- [ ] `ADMIN` cadastra em uma ou mais unidades da própria clínica;
- [ ] `USER` cadastra somente na unidade associada;
- [ ] `USER` em outra unidade recebe `UNIT_ACCESS_DENIED`;
- [ ] `clinicId` divergente recebe `CLINIC_ACCESS_DENIED`;
- [ ] unidade estrangeira recebe `TENANT_RESOURCE_NOT_FOUND`;
- [ ] lista vazia recebe `VALIDATION_ERROR`;
- [ ] duplicidade recebe `PATIENT_ALREADY_EXISTS`;
- [ ] nenhum erro persiste paciente parcialmente;
- [ ] `PrincipalServiceResponse` existe com `id` e `name`;
- [ ] `PatientResponseDTO` possui todos os oito campos;
- [ ] `PatientMapper` completo retorna null para campos sem fonte;
- [ ] `validateClinicId` existe como método privado do service;
- [ ] listagem ADMIN sempre inclui `clinicId` na query;
- [ ] listagem USER sempre inclui `clinicId` e `unitId` na query;
- [ ] filtro `name` é case-insensitive e não amplia o escopo;
- [ ] paginação usa metadados reais;
- [ ] status e serviço principal não são inventados;
- [ ] filtros `status`/`serviceId` não são anunciados como entregues;
- [ ] não foi criada migration desnecessária;
- [ ] testes de cadastro e listagem passam;
- [ ] regressão de agenda passa;
- [ ] READMEs e documentos de estado atual foram atualizados;
- [ ] `./mvnw clean verify` passa com JDK 21 e Docker;
- [ ] as duas changes OpenSpec relevantes passam em modo estrito.

## 33. Resultado esperado

Após a implementação, o fluxo será:

```text
POST /patient/save
  ├── ADMIN ou USER autenticado
  ├── clínica derivada do principal
  ├── validateClinicId para compatibilidade legada
  ├── USER limitado à clinicUnit
  ├── ADMIN limitado às unidades da clínica
  ├── persistência de Patient + PATIENT_UNIT
  └── 201 PatientResponseDTO
      ├── code/createdAt reais
      └── status/principalService nulos sem fonte
```

```text
GET /patient/list?page&size&sort&name
  ├── ADMIN → clínica + nome
  ├── USER  → clínica + unidade + nome
  ├── mapper dentro de transação read-only
  └── PageResponseDTO com metadados reais
```

A API deixará de falhar antes do service por expressão de segurança inválida,
permitirá cadastro operacional sem ceder autoridade sobre tenant/unidade e
fornecerá à interface somente dados reais ou ausência explícita.
