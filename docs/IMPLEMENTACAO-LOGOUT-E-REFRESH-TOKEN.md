# Implementação de logout e refresh token

## 1. Visão geral

Este documento descreve, como um guia de implementação para desenvolvedores, a mudança implementar-logout-e-refresh-token aplicada ao Agendamentos Smart.

A mudança cobre dois repositórios que precisam ser publicados de forma coordenada:

| Camada | Repositório | Responsabilidade |
| --- | --- | --- |
| Frontend | agendamento-smart-web/agendamentos-smart | Exibir Sair, chamar logout, renovar a sessão automaticamente, validar a entrada da aplicação e limpar o estado local quando a sessão expirar. |
| Backend | api-agendamento-smart-api/agendamento-smart-api | Criar a sessão persistida, emitir cookies HttpOnly, rotacionar refresh tokens, revogar a sessão, validar o access token e expirar os cookies. |

Data de referência da implementação: 23/11/2026.

## 2. Objetivo da change

Antes desta implementação, o sistema apresentava o item Sair, porém o item não executava nenhuma ação. O access token também não tinha um ciclo completo de renovação: quando expirava, as chamadas autenticadas falhavam e o frontend não tinha uma estratégia coordenada para renovar a sessão.

O objetivo foi implementar o ciclo completo:

1. login com sessão persistida no backend;
2. access token curto em cookie jwt;
3. refresh token opaco, rotativo e armazenado somente por hash;
4. logout explícito em POST /auth/logout;
5. refresh em POST /auth/refresh;
6. retry único da chamada original após 401;
7. compartilhamento de uma única chamada de refresh quando várias requisições expiram ao mesmo tempo;
8. limpeza do cache autenticado e navegação para /sign-in quando o logout ou a renovação não puderem manter a sessão;
9. ausência de tokens no JSON de login e ausência de tokens em localStorage, sessionStorage, URL ou logs da aplicação.

## 3. Escopo e fora de escopo

### Incluído

- botão Sair do menu de conta;
- endpoint backend de logout idempotente;
- endpoint backend de refresh com rotação;
- persistência de sessões e refresh tokens;
- revogação server-side;
- validação de sessão no filtro de segurança;
- refresh automático no cliente HTTP;
- evento global de sessão expirada;
- validação assíncrona da rota raiz;
- testes unitários, testes de integração, MSW, lint, build e validação OpenSpec;
- documentação dos módulos afetados.

### Não incluído

- recuperação de senha;
- MFA;
- tela de dispositivos ou sessões ativas;
- logout global de todos os dispositivos;
- alteração das regras de ADMIN, USER, clínica ou unidade;
- revogação automática de todas as sessões por troca de senha;
- implementação de uma tela ou guarda completa para cada rota privada;
- adoção de access token em localStorage ou sessionStorage.

## 4. Estado anterior e estado atual

### 4.1 Comparativo funcional

| Ponto | Antes | Depois |
| --- | --- | --- |
| Login | Gerava JWT no controller e mantinha compatibilidade com token no JSON. | Cria AUTH_SESSION, gera access token e refresh token e envia ambos como cookies HttpOnly; o JSON contém somente dados públicos do usuário. |
| Refresh | Não existia. | POST /auth/refresh valida, consome e substitui o refresh token. |
| Logout | O item Sair era somente visual. | POST /auth/logout revoga a sessão, expira os dois cookies e o frontend limpa o cache e vai para /sign-in. |
| Entrada em / | O frontend verificava a presença do cookie jwt via JavaScript e esperava um segundo. | O frontend chama GET /auth/me; o cliente HTTP tenta refresh uma vez quando recebe 401. |
| Access token expirado | A chamada falhava sem renovação coordenada. | A requisição original é repetida uma única vez depois de refresh bem-sucedido. |
| Requisições simultâneas expiradas | Cada chamada poderia tentar uma renovação própria. | Todas aguardam a mesma Promise de refresh, usando single-flight. |
| Reutilização de refresh | Não havia estado persistido para detectar replay. | O token usado é marcado como consumido; a reutilização revoga a sessão inteira. |
| Segurança do JSON | LoginResponseDTO tinha token e entidade User. | LoginResponseDTO usa UserLoginResponse, sem segredo e sem serializar a entidade. |
| CORS | Incluía uma origem inválida com /* e não liberava explicitamente refresh/logout. | Origens exatas, credenciais habilitadas e endpoints de ciclo de sessão liberados. |

### 4.2 Comparativo do bootstrap do frontend

#### Antes

~~~tsx
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

export function FirstScreen() {
  const [cookies] = useCookies(["jwt"]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // pequeno delay para garantir que os cookies foram carregados
    const timer = setTimeout(() => {
      if (!cookies.jwt) {
        navigate("/sign-in");
      } else {
        navigate("/appointments");
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cookies, navigate]);

  if (loading) {
    return <Loader2Icon className="animate-spin w-6 h-6" />;
  }

  return null;
}
~~~

Esse código verificava somente a existência de um cookie. Um cookie presente poderia estar expirado, revogado ou inválido. Além disso, o JavaScript não deve depender da leitura de um cookie HttpOnly.

#### Depois

~~~tsx
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { requestWithSession } from "@/lib/session-client";

export function FirstScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    requestWithSession({ url: '/auth/me', method: 'GET' })
      .then(() => {
        if (active) {
          navigate('/appointments', { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          navigate('/sign-in', { replace: true });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return <Loader2Icon className="animate-spin w-6 h-6" />;
  }

  return null;
}
~~~

Agora a aplicação valida a sessão pelo backend. O fluxo é assíncrono porque somente a API consegue confirmar assinatura, expiração, revogação e vínculo do access token com uma sessão ativa.

### 4.3 Comparativo da base HTTP

#### Antes

~~~tsx
import { api } from './axios'

export const axiosBaseQuery = async ({ url, method, data, params, headers }) => {
  try {
    const response = await api.request({
      url,
      method,
      data,
      params,
      headers,
    })

    return { data: response.data }
  } catch (error) {
    // apenas convertia a exceção em resultado de erro do RTK Query
  }
}
~~~

#### Depois

~~~tsx
import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'

import { requestWithSession } from './session-client'

export interface AxiosBaseQueryArgs {
  url: string
  method?: AxiosRequestConfig['method']
  data?: unknown
  params?: AxiosRequestConfig['params']
  headers?: AxiosRequestConfig['headers']
  skipSessionRefresh?: boolean
}

export interface AxiosBaseQueryError {
  status: number | 'FETCH_ERROR'
  data: unknown
}

export const axiosBaseQuery: BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError
> = async ({ url, method, data, params, headers, skipSessionRefresh }) => {
  try {
    const response = await requestWithSession({
      url,
      method,
      data,
      params,
      headers,
      skipSessionRefresh,
    })

    return { data: response.data }
  } catch (error) {
    const axiosError = error as AxiosError

    return {
      error: {
        status: axiosError.response?.status ?? 'FETCH_ERROR',
        data: axiosError.response?.data ?? axiosError.message,
      },
    }
  }
}
~~~

## 5. Desenho do fluxo completo

~~~mermaid
sequenceDiagram
    autonumber
    participant U as Usuário
    participant F as Frontend
    participant API as API
    participant DB as PostgreSQL

    U->>F: Envia login e senha
    F->>API: POST /auth/login
    API->>DB: Cria AUTH_SESSION
    API->>DB: Armazena hash do refresh token
    API-->>F: 200 + Set-Cookie jwt + refresh_token
    Note over F,API: Ambos os cookies são HttpOnly

    F->>API: Recurso protegido com cookie jwt
    API->>DB: Confirma sessão ativa pelo sid
    API-->>F: 200 recurso

    F->>API: Recurso protegido
    API-->>F: 401 access expirado
    F->>API: POST /auth/refresh com refresh_token
    API->>DB: Lock do hash, valida e marca used_at
    API->>DB: Insere hash do refresh substituto
    API-->>F: 204 + novos Set-Cookie
    F->>API: Repete recurso original uma única vez
    API-->>F: 200 recurso

    U->>F: Clica em Sair
    F->>API: POST /auth/logout com refresh_token
    API->>DB: Marca sessão e tokens como revogados
    API-->>F: 204 + expiração dos cookies
    F->>F: Limpa cache RTK Query
    F->>F: Navega para /sign-in
~~~

### 5.1 Fluxo de refresh rejeitado

~~~mermaid
flowchart TD
    A[Requisição autenticada] --> B{Resposta 401?}
    B -- Não --> C[Entregar resposta ao fluxo original]
    B -- Sim --> D{Refresh permitido e ainda não tentado?}
    D -- Não --> E[Propagar erro]
    D -- Sim --> F[Entrar ou aguardar refresh single-flight]
    F --> G{POST /auth/refresh sucesso?}
    G -- Sim --> H[Repetir requisição original uma vez]
    G -- Não --> I[Emitir evento de sessão expirada]
    I --> J[Resetar cache e navegar para /sign-in]
~~~

## 6. Implementação do frontend

### 6.1 Cliente de sessão compartilhado

Arquivo: src/lib/session-client.ts.

~~~ts
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

import { api } from './axios'

export interface SessionRequestConfig extends AxiosRequestConfig {
  skipSessionRefresh?: boolean
  sessionRetry?: boolean
}

const SESSION_EXPIRED_EVENT = 'agendamentos-smart:session-expired'

let refreshPromise: Promise<void> | null = null
let expirationEventEmitted = false

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', undefined, { withCredentials: true })
      .then(() => {
        expirationEventEmitted = false
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function requestWithSession<T = unknown>(
  config: SessionRequestConfig,
): Promise<AxiosResponse<T>> {
  const { skipSessionRefresh, sessionRetry, ...axiosConfig } = config

  try {
    return await api.request<T>(axiosConfig)
  } catch (error) {
    const status = getResponseStatus(error)
    const canRefresh =
      status === 401 && !skipSessionRefresh && !sessionRetry

    if (!canRefresh) {
      throw error
    }

    try {
      await refreshSession()
      return await api.request<T>(axiosConfig)
    } catch (refreshError) {
      emitSessionExpired()
      throw refreshError
    }
  }
}

export function clearSessionExpirationSignal() {
  expirationEventEmitted = false
}

function emitSessionExpired() {
  if (expirationEventEmitted || typeof window === 'undefined') {
    return
  }

  expirationEventEmitted = true
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export function addSessionExpiredListener(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handler = () => listener()
  window.addEventListener(SESSION_EXPIRED_EVENT, handler)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
}

function getResponseStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined
  }

  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return undefined
  }

  return typeof response.status === 'number' ? response.status : undefined
}
~~~

Decisões importantes:

- refreshPromise impede que duas ou mais respostas 401 provoquem refresh concorrente;
- cada requisição original pode ser repetida no máximo uma vez;
- o refresh não passa pelo próprio fluxo de refresh, pois usa api.post diretamente;
- withCredentials: true garante o envio dos cookies;
- o evento global é deduplicado por ciclo;
- não há leitura, gravação ou exposição do valor de nenhum token;
- skipSessionRefresh é usado pelo logout para que um erro na chamada de logout não gere outro refresh;
- sessionRetry está disponível para evitar loops quando um consumidor precisar declarar explicitamente que já está em retry.

### 6.2 Integração com RTK Query

Arquivo: src/lib/axios-base-query.ts.

Todos os endpoints RTK Query que usam baseApi passam pela camada de sessão. Isso inclui perfil, agenda, pacientes, profissionais, serviços e demais endpoints que usam axiosBaseQuery.

Arquivo: src/lib/base-api.ts.

~~~ts
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: [
    'Appointment',
    'Session',
    'Profile',
    'PatientCatalog',
    'UnitCatalog',
    'ServiceCatalog',
    'ProfessionalCatalog',
    'ServicePackage',
  ],
  endpoints: () => ({}),
})
~~~

### 6.3 Mutation de logout

Arquivo: src/api/session.ts.

~~~ts
import { baseApi } from '@/lib/base-api'

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        skipSessionRefresh: true,
      }),
    }),
  }),
})

export const { useLogoutMutation } = sessionApi
~~~

O skipSessionRefresh é essencial: logout deve ser uma operação idempotente e não pode tentar renovar uma sessão que já está sendo encerrada ou que já expirou.

### 6.4 Ação Sair no menu de conta

Arquivo: src/components/account-menu.tsx.

#### Antes

~~~tsx
<DropdownMenuItem className="text-rose-500 dark:text-rose-400">
  <LogOut className="mr-2 size-4" />
  <span>Sair</span>
</DropdownMenuItem>
~~~

Era apenas um item visual, sem onSelect, sem chamada HTTP, sem limpeza e sem navegação.

#### Depois: imports, estado e handler

~~~tsx
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useLogoutMutation } from '@/api/session'
import { baseApi } from '@/lib/base-api'
import { clearSessionExpirationSignal } from '@/lib/session-client'
import type { AppDispatch } from '@/lib/store'
~~~

~~~tsx
const [isMenuOpen, setIsMenuOpen] = useState(false)
const dispatch = useDispatch<AppDispatch>()
const navigate = useNavigate()
const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

async function handleLogout() {
  try {
    await logout().unwrap()
    toast.success('Sessão encerrada')
  } catch {
    // Se a sessão já expirou ou a API está indisponível,
    // a limpeza local ainda deve acontecer.
    toast.success('Sessão encerrada localmente')
  } finally {
    dispatch(baseApi.util.resetApiState())
    clearSessionExpirationSignal()
    setIsMenuOpen(false)
    navigate('/sign-in', { replace: true })
  }
}
~~~

~~~tsx
<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
  {/* trigger e demais itens */}

  <DropdownMenuItem
    disabled={isLoggingOut}
    onSelect={(event) => {
      event.preventDefault()
      void handleLogout()
    }}
    className="text-rose-500 dark:text-rose-400"
  >
    <LogOut className="mr-2 size-4" />
    <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
  </DropdownMenuItem>
</DropdownMenu>
~~~

#### Ordem do logout no frontend

1. o usuário seleciona Sair;
2. o frontend chama POST /auth/logout com cookies;
3. a ação fica desabilitada e mostra Saindo...;
4. em sucesso, mostra Sessão encerrada;
5. em falha, trata a sessão como encerrada localmente e mostra Sessão encerrada localmente;
6. em ambos os casos, executa resetApiState();
7. libera o sinal global de expiração;
8. fecha o menu;
9. navega para /sign-in com replace: true.

### 6.5 Tratamento global de sessão expirada

Arquivo: src/components/session-expired-redirect.tsx.

~~~tsx
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  addSessionExpiredListener,
  clearSessionExpirationSignal,
} from '@/lib/session-client'
import { baseApi } from '@/lib/base-api'
import type { AppDispatch } from '@/lib/store'

export function SessionExpiredRedirect() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  useEffect(() => {
    return addSessionExpiredListener(() => {
      dispatch(baseApi.util.resetApiState())
      clearSessionExpirationSignal()
      navigate('/sign-in', { replace: true })
      toast.error('Sua sessão expirou. Entre novamente.')
    })
  }, [dispatch, navigate])

  return null
}
~~~

O componente é montado uma vez dentro do router:

~~~tsx
export function Router() {
  return (
    <>
      <SessionExpiredRedirect />
      <Routes>
        {/* rotas existentes */}
      </Routes>
    </>
  )
}
~~~

Antes, Router retornava somente Routes. Agora existe um único listener global responsável pelo evento emitido quando o refresh definitivo falha.

### 6.6 Login no frontend

Arquivo: src/api/sign-in.ts.

~~~ts
import { baseApi } from '@/lib/base-api'
import type { SignInBody, SignInResponse } from '@/@types/auth'

export const signInApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signIn: builder.mutation<SignInResponse, SignInBody>({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        data,
      }),
    }),
  }),
})

export const { useSignInMutation } = signInApi
~~~

O componente de login continua tratando apenas sucesso ou erro da mutation:

~~~tsx
async function handleLogin(data: SignInFormValues) {
  try {
    await authenticate({ login: data.login, password: data.password }).unwrap()
    navigate('/appointments')
    toast.success('Conectado com sucesso')
  } catch {
    toast.error('Credenciais inválidas')
  }
}
~~~

O navegador recebe os cookies pelo cabeçalho Set-Cookie; o JavaScript não precisa receber nem guardar o token.

### 6.7 Contrato TypeScript sem token

Arquivo: src/@types/auth.ts.

~~~ts
export interface SignInBody {
  login: string
  password: string
}

export interface SignInResponse {
  user?: unknown
}

export interface SignInFormValues {
  login: string
  password: string
}
~~~

Antes existia token?: unknown em SignInResponse. Esse campo foi removido porque o token não faz parte do contrato de aplicação no frontend.

### 6.8 Axios e credenciais

Arquivo: src/lib/axios.ts.

~~~ts
import { env } from '@/env'
import axios from 'axios'

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
})
~~~

O withCredentials: true é obrigatório para que login, refresh, logout e requisições autenticadas troquem cookies entre frontend e API em um cenário cross-origin permitido.

### 6.9 Limpeza da cadeia antiga de armazenamento

Foram removidos os arquivos que compunham a cadeia antiga de token acessível ao frontend:

- src/api/auth.ts;
- src/api/storageProxy.ts;
- src/constants/authorizationConstants.ts;
- src/context/useGlobalContextEXCLUIR.tsx.

O README do contexto foi atualizado para refletir a ausência dessa estratégia.

Busca de armazenamento que permaneceu no frontend:

~~~tsx
// src/components/theme/theme-provider.tsx
localStorage.getItem(storageKey)
localStorage.setItem(storageKey, theme)
~~~

Esse uso é exclusivamente para preferência visual de tema. Não guarda access token, refresh token, credencial ou sessão.

### 6.10 MSW e testes do frontend

O cenário de teste passou a controlar chamadas de refresh e logout:

~~~ts
interface ApiScenario {
  // ...demais campos do cenário
  refreshRequests: number
  refreshErrorStatus: number | null
  logoutRequests: number
  logoutErrorStatus: number | null
}
~~~

~~~ts
http.post('http://localhost:8080/auth/refresh', () => {
  apiScenario.refreshRequests += 1

  if (apiScenario.refreshErrorStatus) {
    return HttpResponse.json({}, { status: apiScenario.refreshErrorStatus })
  }

  return new HttpResponse(null, { status: 204 })
}),

http.post('http://localhost:8080/auth/logout', () => {
  apiScenario.logoutRequests += 1

  if (apiScenario.logoutErrorStatus) {
    return HttpResponse.json({}, { status: apiScenario.logoutErrorStatus })
  }

  return new HttpResponse(null, { status: 204 })
}),
~~~

Testes adicionados ou ajustados:

- src/lib/__tests__/session-client.test.ts:
  - refresh aceito e retry da chamada original;
  - duas requisições expiradas compartilham uma única chamada de refresh;
  - refresh rejeitado emite o evento de sessão expirada;
- src/api/firstScreen/first-screen.test.tsx:
  - sessão válida encaminha para agenda;
  - auth/me e refresh rejeitados encaminham para login;
- src/components/__tests__/app-topbar.test.tsx:
  - logout bem-sucedido chama a API e exibe confirmação;
  - falha da API ainda limpa a sessão local e exibe confirmação local;
- src/api/__tests__/remote-endpoints.test.ts:
  - contrato de login sem dependência de token;
- testes de login:
  - permanecem focados no payload, navegação, feedback e estado de carregamento;
  - valores como session-token presentes em fixtures são marcadores sintéticos de mock e não são persistidos nem usados pelo cliente.

## 7. Implementação do backend

### 7.1 Migração de banco

Arquivo: V015__create_auth_sessions.sql.

~~~sql
CREATE TABLE AUTH_SESSION (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    CONSTRAINT pk_auth_session PRIMARY KEY (id),
    CONSTRAINT fk_auth_session_user
        FOREIGN KEY (user_id)
        REFERENCES USERS (id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
);

CREATE INDEX idx_auth_session_user ON AUTH_SESSION (user_id);
CREATE INDEX idx_auth_session_active ON AUTH_SESSION (id, revoked_at, expires_at);

CREATE TABLE AUTH_REFRESH_TOKEN (
    id UUID NOT NULL,
    session_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    CONSTRAINT pk_auth_refresh_token PRIMARY KEY (id),
    CONSTRAINT uk_auth_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_auth_refresh_token_session
        FOREIGN KEY (session_id)
        REFERENCES AUTH_SESSION (id)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
);

CREATE INDEX idx_auth_refresh_token_session ON AUTH_REFRESH_TOKEN (session_id);
CREATE INDEX idx_auth_refresh_token_lookup ON AUTH_REFRESH_TOKEN (token_hash, expires_at);
~~~

Modelo de dados:

| Tabela | Finalidade | Valor sensível armazenado? |
| --- | --- | --- |
| AUTH_SESSION | Representa a sessão persistida, seu usuário, validade e revogação. | Não. |
| AUTH_REFRESH_TOKEN | Representa cada valor de refresh emitido dentro da sessão, com controle de uso. | Não. Guarda somente SHA-256 hexadecimal em token_hash. |

O access JWT contém o identificador sid da sessão, mas o refresh token bruto nunca é persistido.

### 7.2 Entidades

Arquivo: AuthSession.java.

~~~java
package com.agendamento.smart.model.session;

import com.agendamento.smart.model.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "AUTH_SESSION")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public boolean isActive(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }
}
~~~

Arquivo: AuthRefreshToken.java.

~~~java
package com.agendamento.smart.model.session;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "AUTH_REFRESH_TOKEN")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AuthSession session;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public boolean isUsable(Instant now) {
        return usedAt == null && revokedAt == null && expiresAt.isAfter(now)
                && session.isActive(now);
    }
}
~~~

### 7.3 Repositórios com lock

Arquivo: AuthSessionRepository.java.

~~~java
package com.agendamento.smart.repository;

import com.agendamento.smart.model.session.AuthSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AuthSession s join fetch s.user where s.id = :id")
    Optional<AuthSession> findByIdForUpdate(@Param("id") UUID id);

    @Query("select s from AuthSession s join fetch s.user where s.id = :id")
    Optional<AuthSession> findWithUserById(@Param("id") UUID id);
}
~~~

Arquivo: AuthRefreshTokenRepository.java.

~~~java
package com.agendamento.smart.repository;

import com.agendamento.smart.model.session.AuthRefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AuthRefreshTokenRepository extends JpaRepository<AuthRefreshToken, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from AuthRefreshToken t join fetch t.session s join fetch s.user where t.tokenHash = :tokenHash")
    Optional<AuthRefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("update AuthRefreshToken t set t.revokedAt = :revokedAt where t.session.id = :sessionId and t.revokedAt is null")
    int revokeAllBySessionId(@Param("sessionId") UUID sessionId, @Param("revokedAt") Instant revokedAt);
}
~~~

O PESSIMISTIC_WRITE impede duas requisições concorrentes de consumirem o mesmo refresh token válido ao mesmo tempo.

### 7.4 Serviço de sessão

Arquivo: AuthSessionService.java.

~~~java
package com.agendamento.smart.service;

import com.agendamento.smart.infra.security.TokenService;
import com.agendamento.smart.model.session.AuthRefreshToken;
import com.agendamento.smart.model.session.AuthSession;
import com.agendamento.smart.model.user.User;
import com.agendamento.smart.repository.AuthRefreshTokenRepository;
import com.agendamento.smart.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final AuthSessionRepository sessionRepository;
    private final AuthRefreshTokenRepository refreshTokenRepository;
    private final TokenService tokenService;
    private final Clock clock = Clock.systemUTC();
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${api.security.token.refresh-ttl:30d}")
    private Duration refreshTokenTtl;

    @Transactional
    public SessionTokens create(User user) {
        Instant now = clock.instant();
        AuthSession session = sessionRepository.saveAndFlush(AuthSession.builder()
                .user(user)
                .createdAt(now)
                .expiresAt(now.plus(refreshTokenTtl))
                .build());

        String refreshToken = newRefreshToken();
        refreshTokenRepository.save(AuthRefreshToken.builder()
                .session(session)
                .tokenHash(hash(refreshToken))
                .createdAt(now)
                .expiresAt(session.getExpiresAt())
                .build());

        return new SessionTokens(
                tokenService.generateAccessToken(user, session.getId()),
                refreshToken,
                session.getExpiresAt());
    }

    @Transactional
    public SessionTokens refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidSessionException();
        }
        Instant now = clock.instant();
        AuthRefreshToken current = refreshTokenRepository
                .findByTokenHashForUpdate(hash(rawRefreshToken))
                .orElseThrow(InvalidSessionException::new);

        if (!current.isUsable(now)) {
            revoke(current.getSession(), now);
            throw new InvalidSessionException();
        }

        current.setUsedAt(now);
        refreshTokenRepository.save(current);

        String replacement = newRefreshToken();
        refreshTokenRepository.save(AuthRefreshToken.builder()
                .session(current.getSession())
                .tokenHash(hash(replacement))
                .createdAt(now)
                .expiresAt(current.getSession().getExpiresAt())
                .build());

        return new SessionTokens(
                tokenService.generateAccessToken(current.getSession().getUser(), current.getSession().getId()),
                replacement,
                current.getSession().getExpiresAt());
    }

    @Transactional(readOnly = true)
    public boolean isActive(UUID sessionId, String login) {
        return sessionRepository.findWithUserById(sessionId)
                .filter(session -> session.isActive(clock.instant()))
                .filter(session -> session.getUser().getLogin().equalsIgnoreCase(login))
                .isPresent();
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenHashForUpdate(hash(rawRefreshToken))
                .ifPresent(token -> revoke(token.getSession(), clock.instant()));
    }

    private void revoke(AuthSession session, Instant now) {
        if (session.getRevokedAt() == null) {
            session.setRevokedAt(now);
            sessionRepository.save(session);
        }
        refreshTokenRepository.revokeAllBySessionId(session.getId(), now);
    }

    private String newRefreshToken() {
        byte[] value = new byte[48];
        secureRandom.nextBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 não está disponível", exception);
        }
    }

    public record SessionTokens(String accessToken, String refreshToken, Instant sessionExpiresAt) {
    }

    public static class InvalidSessionException extends RuntimeException {
    }
}
~~~

Regras do serviço:

1. create cria uma sessão com validade de refresh, gera 48 bytes aleatórios e persiste somente o hash.
2. refresh localiza o hash com lock pessimista.
3. Token ausente ou não encontrado gera InvalidSessionException.
4. Token expirado, usado, revogado ou associado a sessão inválida revoga a sessão e falha.
5. Token válido recebe usedAt e nunca pode ser reutilizado.
6. Um novo refresh é criado para a mesma sessão.
7. O access token substituto recebe o mesmo sid.
8. logout não falha se o cookie estiver ausente ou já não puder ser localizado.
9. isActive confirma validade temporal, ausência de revogação e correspondência do login do usuário.

### 7.5 Geração e leitura do JWT

Arquivo: TokenService.java.

~~~java
package com.agendamento.smart.infra.security;

import com.agendamento.smart.model.user.User;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class TokenService {

    @Value("${api.security.token.secret}")
    String secret;

    @Value("${api.security.token.access-ttl:15m}")
    Duration accessTokenTtl;

    public String generateAccessToken(User user, UUID sessionId) {
        return createToken(user, sessionId, accessTokenTtl);
    }

    /**
     * Mantém compatibilidade com consumidores técnicos que ainda criam um
     * access token diretamente para o cabeçalho Authorization.
     */
    public String generateToken(User user) {
        return createToken(user, null, Duration.ofHours(2));
    }

    private String createToken(User user, UUID sessionId, Duration ttl) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            var builder = JWT.create()
                    .withIssuer("agendamento-smart-api")
                    .withSubject(user.getUsername())
                    .withClaim("token_type", "access")
                    .withExpiresAt(Instant.now().plus(ttl));
            if (sessionId != null) {
                builder.withClaim("sid", sessionId.toString());
            }
            return builder.sign(algorithm);
        } catch (JWTCreationException ex) {
            throw new RuntimeException("Error while generating token", ex);
        }
    }

    public TokenClaims parse(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            DecodedJWT decoded = JWT.require(algorithm)
                    .withIssuer("agendamento-smart-api")
                    .build()
                    .verify(token);
            String tokenType = decoded.getClaim("token_type").asString();
            if (tokenType != null && !"access".equals(tokenType)) {
                return null;
            }
            String sessionId = decoded.getClaim("sid").asString();
            return new TokenClaims(
                    decoded.getSubject(),
                    sessionId == null ? null : UUID.fromString(sessionId));
        } catch (JWTVerificationException | IllegalArgumentException exception) {
            return null;
        }
    }

    public record TokenClaims(String subject, UUID sessionId) {
    }
}
~~~

O serviço anterior retornava somente o subject via validateToken. O serviço atual retorna TokenClaims, permitindo ao filtro saber o login, o sid e a sessão que precisa ser consultada.

O método generateToken(User) foi preservado para consumidores técnicos que ainda geram token para o cabeçalho Authorization. Tokens emitidos pelo login normal sempre passam por generateAccessToken(user, sessionId).

### 7.6 Filtro de segurança

Arquivo: SecurityFilter.java.

~~~java
package com.agendamento.smart.infra.security;

import com.agendamento.smart.repository.UserRepository;
import com.agendamento.smart.service.AuthSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthSessionService authSessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();

        if (path.startsWith("/auth/login")
                || path.startsWith("/auth/refresh")
                || path.startsWith("/auth/logout")
                || path.startsWith("/auth/register")) {
            filterChain.doFilter(request, response);
            return;
        }

        var token = this.recoverToken(request);
        boolean tokenFromCookie = false;

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    tokenFromCookie = true;
                }
            }
        }

        if (token != null && !token.isBlank()) {
            TokenService.TokenClaims claims = tokenService.parse(token);

            if (claims != null && claims.subject() != null && !claims.subject().isBlank()) {
                boolean sessionActive = claims.sessionId() == null
                        ? !tokenFromCookie
                        : authSessionService.isActive(claims.sessionId(), claims.subject());
                UserDetails user = sessionActive
                        ? userRepository.findByLogin(claims.subject())
                        : null;

                if (user != null) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    user.getAuthorities()
                            );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) return null;
        return authHeader.replace("Bearer ", "");
    }
}
~~~

Regras:

- login, refresh, logout e registro passam sem access token;
- o cookie jwt prevalece quando existe junto com Authorization;
- refresh_token não autentica endpoints de negócio;
- access token com sid exige uma sessão ativa no banco;
- access token técnico sem sid continua aceito pelo cabeçalho Authorization, mas não pelo cookie;
- access token inválido, expirado ou associado a sessão revogada resulta em 401 quando uma credencial foi apresentada;
- a lógica de autorização por papel continua no Spring Security e nas anotações existentes.

### 7.7 Controller de autenticação

Arquivo: AuthenticationController.java.

#### Antes: login sem sessão persistida

~~~java
var token = tokenService.generateToken((User) auth.getPrincipal());

ResponseCookie cookie = ResponseCookie.from("jwt", token)
        .httpOnly(true)
        .secure(jwtCookieSecure)
        .path("/")
        .maxAge(Duration.ofHours(1))
        .sameSite(jwtCookieSameSite)
        .build();

response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
User user = (User) userRepository.findByLogin(data.login());
System.out.println("Login");
System.out.println(user.getRole());
return ResponseEntity.ok(new LoginResponseDTO(token, user));
~~~

#### Depois: endpoints e cookies

~~~java
@PostMapping("/login")
public ResponseEntity<LoginResponseDTO> login(
        @RequestBody @Valid AuthenticationDTO data,
        HttpServletResponse response) {
    var credentials = new UsernamePasswordAuthenticationToken(
            data.login(), data.password());
    var auth = authenticationManager.authenticate(credentials);

    User user = (User) auth.getPrincipal();
    AuthSessionService.SessionTokens tokens = authSessionService.create(user);
    addSessionCookies(response, tokens);

    return ResponseEntity.ok(new LoginResponseDTO(new UserLoginResponse(
            user.getId(),
            user.getLogin(),
            user.getRole(),
            user.getClinic().getId(),
            user.getClinicUnit().getId())));
}

@PostMapping("/refresh")
public ResponseEntity<Void> refresh(
        HttpServletRequest request,
        HttpServletResponse response) {
    String refreshToken = cookieValue(request, refreshCookieName);
    try {
        AuthSessionService.SessionTokens tokens =
                authSessionService.refresh(refreshToken);
        addSessionCookies(response, tokens);
        return ResponseEntity.noContent().build();
    } catch (AuthSessionService.InvalidSessionException exception) {
        clearSessionCookies(response);
        return ResponseEntity.status(401).build();
    }
}

@PostMapping("/logout")
public ResponseEntity<Void> logout(
        HttpServletRequest request,
        HttpServletResponse response) {
    authSessionService.logout(cookieValue(request, refreshCookieName));
    clearSessionCookies(response);
    return ResponseEntity.noContent().build();
}
~~~

Helpers usados pelo controller:

~~~java
private void addSessionCookies(
        HttpServletResponse response,
        AuthSessionService.SessionTokens tokens) {
    response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
            accessCookieName, tokens.accessToken(), accessCookieTtl).toString());
    response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
            refreshCookieName, tokens.refreshToken(), refreshCookieTtl).toString());
}

private void clearSessionCookies(HttpServletResponse response) {
    response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
            accessCookieName, "", Duration.ZERO).toString());
    response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
            refreshCookieName, "", Duration.ZERO).toString());
}

private ResponseCookie sessionCookie(
        String name,
        String value,
        Duration maxAge) {
    return ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(jwtCookieSecure)
            .path("/")
            .maxAge(maxAge)
            .sameSite(jwtCookieSameSite)
            .build();
}

private String cookieValue(HttpServletRequest request, String name) {
    if (request.getCookies() == null) {
        return null;
    }
    for (Cookie cookie : request.getCookies()) {
        if (name.equals(cookie.getName())) {
            return cookie.getValue();
        }
    }
    return null;
}
~~~

O restante do controller, incluindo /auth/list, /auth/me e a conversão de respostas de usuário, foi preservado. Os trechos acima mostram todas as alterações do ciclo de sessão.

### 7.8 DTO de login seguro

Arquivo: LoginResponseDTO.java.

~~~java
package com.agendamento.smart.dtos;

public record LoginResponseDTO(UserLoginResponse user) {
}
~~~

Arquivo: UserLoginResponse.java.

~~~java
package com.agendamento.smart.dtos;

import com.agendamento.smart.model.user.UserRole;

import java.util.UUID;

public record UserLoginResponse(
        UUID id,
        String login,
        UserRole role,
        UUID clinicId,
        UUID activeUnitId
) {
}
~~~

Antes, LoginResponseDTO era:

~~~java
public record LoginResponseDTO(String token, User user) {
}
~~~

Essa forma expunha o token no JSON e serializava a entidade de domínio. A forma atual expõe somente dados explicitamente escolhidos.

### 7.9 Configuração de cookies e TTL

Arquivo: application.yaml.

~~~yaml
api:
  security:
    cookie:
      secure: ${JWT_COOKIE_SECURE:false}
      same-site: ${JWT_COOKIE_SAME_SITE:Lax}
      access-name: ${JWT_ACCESS_COOKIE_NAME:jwt}
      refresh-name: ${JWT_REFRESH_COOKIE_NAME:refresh_token}
    token:
      secret: ${JWT_SECRET}
      access-ttl: ${JWT_ACCESS_TTL:15m}
      refresh-ttl: ${JWT_REFRESH_TTL:30d}
~~~

Arquivo: application-prod.yaml.

~~~yaml
api:
  security:
    cookie:
      secure: ${JWT_COOKIE_SECURE:true}
      same-site: ${JWT_COOKIE_SAME_SITE:None}
      access-name: ${JWT_ACCESS_COOKIE_NAME:jwt}
      refresh-name: ${JWT_REFRESH_COOKIE_NAME:refresh_token}
    token:
      access-ttl: ${JWT_ACCESS_TTL:15m}
      refresh-ttl: ${JWT_REFRESH_TTL:30d}
~~~

Valores padrão:

| Propriedade | Desenvolvimento | Produção |
| --- | --- | --- |
| secure | false | true |
| same-site | Lax | None |
| access cookie | jwt | jwt |
| refresh cookie | refresh_token | refresh_token |
| access TTL | 15m | 15m |
| refresh TTL | 30d | 30d |
| segredo | obrigatório por JWT_SECRET | obrigatório por JWT_SECRET |

Em produção, SameSite=None exige Secure=true no navegador. Os nomes, TTLs e atributos podem ser sobrescritos por variáveis de ambiente sem alterar o código.

### 7.10 Spring Security e CORS

Arquivo: SecurityConfiguration.java.

Endpoints liberados:

~~~java
.requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
.requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
.requestMatchers(HttpMethod.POST, "/auth/logout").permitAll()
.requestMatchers("/error").permitAll()
~~~

Origens permitidas:

~~~java
config.setAllowedOrigins(List.of(
        "https://agendamentos-smart.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
));

config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);
config.setMaxAge(3600L);
~~~

Foi removida a origem inválida https://agendamentos-smart.vercel.app/*. CORS recebe origens exatas; wildcard de path não é uma origem válida.

### 7.11 Contrato HTTP final

#### POST /auth/login

~~~http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "login": "usuario@clinica.test",
  "password": "senha"
}
~~~

Resposta conceitual:

~~~http
HTTP/1.1 200 OK
Set-Cookie: jwt=<access-jwt>; Path=/; Max-Age=900; HttpOnly; SameSite=Lax
Set-Cookie: refresh_token=<opaque-refresh>; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax
Content-Type: application/json

{
  "user": {
    "id": "uuid",
    "login": "usuario@clinica.test",
    "role": "ADMIN",
    "clinicId": "uuid",
    "activeUnitId": "uuid"
  }
}
~~~

O valor bruto de jwt e refresh_token não aparece no corpo JSON.

#### POST /auth/refresh

~~~http
POST /auth/refresh HTTP/1.1
Cookie: refresh_token=<refresh-atual>
~~~

Sucesso:

~~~http
HTTP/1.1 204 No Content
Set-Cookie: jwt=<novo-access>; ...
Set-Cookie: refresh_token=<novo-refresh>; ...
~~~

Falha:

~~~http
HTTP/1.1 401 Unauthorized
Set-Cookie: jwt=; Max-Age=0; ...
Set-Cookie: refresh_token=; Max-Age=0; ...
~~~

O endpoint não exige access token válido porque sua função é justamente substituir um access token expirado.

#### POST /auth/logout

~~~http
POST /auth/logout HTTP/1.1
Cookie: refresh_token=<refresh-atual>
~~~

Sucesso, inclusive quando já não há sessão válida:

~~~http
HTTP/1.1 204 No Content
Set-Cookie: jwt=; Max-Age=0; ...
Set-Cookie: refresh_token=; Max-Age=0; ...
~~~

O endpoint é idempotente: cookie ausente, token já revogado ou token não encontrado não criam uma sessão nem impedem a limpeza dos cookies.

#### GET /auth/me

Continua sendo o endpoint autenticado usado pelo bootstrap do frontend. Se o access token ainda for válido, responde o perfil. Se estiver expirado e o refresh for válido, o cliente renova antes de repetir. Se ambos falharem, o frontend vai para /sign-in.

## 8. Segurança e análise de ameaças

### 8.1 Por que o refresh é opaco

O refresh token é um valor aleatório, não contém claims de negócio e não precisa ser interpretado pelo frontend. O backend armazena somente o SHA-256 hexadecimal. Mesmo que a tabela seja lida, o valor enviado pelo navegador não fica exposto diretamente na persistência.

### 8.2 Por que existe rotação

Um refresh token válido é de uso único. Ao fazer refresh:

1. o hash atual é localizado com lock;
2. used_at é preenchido;
3. um novo valor aleatório é gerado;
4. somente o hash do novo valor é armazenado;
5. novos cookies são enviados.

Se o valor antigo for reapresentado, ele não é considerado apenas inválido: a sessão relacionada é revogada e os refresh tokens restantes são revogados. Isso permite detectar replay do refresh token.

### 8.3 Por que o access token possui sid

Um JWT puramente stateless não poderia ser invalidado imediatamente pelo logout. O claim sid vincula o JWT à linha de AUTH_SESSION. O filtro consulta a sessão antes de autenticar a requisição; depois do logout, o mesmo JWT deixa de ser aceito.

### 8.4 Por que o refresh token não autentica recursos

O filtro só lê:

- Authorization: Bearer <access-token>;
- cookie jwt.

O cookie refresh_token só é interpretado pelos endpoints /auth/refresh e /auth/logout. Um refresh token não pode ser usado diretamente para acessar agenda, pacientes, perfil ou qualquer outro recurso protegido.

### 8.5 Compatibilidade técnica

Tokens emitidos para consumidores técnicos via Authorization ainda podem não possuir sid, e por isso continuam aceitos pelo caminho legado. A sessão normal do browser usa sempre o access token com sid no cookie jwt, que é validado contra o banco.

### 8.6 Cookies

Todos os cookies de sessão têm:

- HttpOnly=true;
- Path=/;
- Secure configurável por ambiente;
- SameSite configurável por ambiente;
- Max-Age coerente com o TTL do token;
- expiração explícita com Max-Age=0 no logout e em refresh inválido.

### 8.7 CSRF

A change restringe origens CORS e usa cookies HttpOnly, mas a proteção CSRF completa para todos os recursos autenticados não foi incluída no escopo. Essa decisão deve ser reavaliada se a API passar a aceitar mais origens, formulários cross-site ou integrações que ampliem a superfície de requisições com credenciais.

## 9. Passo a passo de implementação como desenvolvedor

### Passo 1 — Entender o contrato existente

1. Localizar a instância Axios e confirmar withCredentials.
2. Localizar a base query do RTK Query.
3. Localizar o menu de conta e verificar se Sair tinha handler.
4. Localizar o bootstrap da rota /.
5. Localizar o controller de autenticação, TokenService e SecurityFilter.
6. Verificar como o login retornava o token.
7. Verificar como os testes extraíam o token das respostas.

### Passo 2 — Definir o contrato

1. Login continua recebendo login e senha.
2. Login passa a emitir dois cookies.
3. Refresh não recebe body e usa somente refresh_token.
4. Logout é POST, público e idempotente.
5. Respostas de refresh/logout não carregam tokens no JSON.
6. O frontend nunca lê os cookies.

### Passo 3 — Criar persistência

1. Criar V015__create_auth_sessions.sql.
2. Criar AuthSession.
3. Criar AuthRefreshToken.
4. Criar consultas com PESSIMISTIC_WRITE.
5. Criar índice por hash e por sessão.

### Passo 4 — Implementar o serviço de sessão

1. Gerar refresh com SecureRandom.
2. Persistir somente SHA-256.
3. Gerar access token com sid.
4. Validar expiração, revogação e uso único.
5. Rotacionar refresh.
6. Revogar a sessão inteira em replay.
7. Implementar logout idempotente.

### Passo 5 — Adaptar o backend HTTP

1. Alterar o controller de login para usar AuthSessionService.
2. Remover o token do DTO JSON.
3. Adicionar /auth/refresh.
4. Adicionar /auth/logout.
5. Criar cookies com os mesmos atributos na emissão e na limpeza.
6. Liberar refresh/logout no Spring Security.
7. Corrigir a lista de CORS.

### Passo 6 — Adaptar a validação de acesso

1. Alterar TokenService para retornar claims.
2. Validar emissor, assinatura, expiração e tipo.
3. Consultar sessão quando houver sid.
4. Fazer o cookie jwt prevalecer sobre Authorization.
5. Retornar 401 quando uma credencial inválida for apresentada.

### Passo 7 — Implementar o cliente de sessão

1. Criar requestWithSession.
2. Criar refreshPromise compartilhada.
3. Fazer retry único.
4. Bloquear retry da própria chamada de refresh.
5. Emitir evento global em falha definitiva.
6. Integrar à base query.

### Passo 8 — Implementar logout visual

1. Criar mutation sessionApi.logout.
2. Ligar o item Sair ao handler.
3. Desabilitar o item enquanto a chamada está pendente.
4. Resetar cache em sucesso e falha.
5. Fechar menu.
6. Navegar para /sign-in.

### Passo 9 — Corrigir a entrada da aplicação

1. Remover useCookies(['jwt']).
2. Remover a espera artificial.
3. Chamar /auth/me pela camada de sessão.
4. Ir para agenda em sessão válida.
5. Ir para login após falha de /auth/me e refresh.

### Passo 10 — Cobrir os cenários

1. Login deve emitir jwt e refresh_token.
2. JSON não deve conter token.
3. Refresh deve substituir o refresh anterior.
4. Refresh antigo deve gerar 401 e revogar a sessão.
5. Logout deve expirar cookies.
6. Logout repetido deve continuar em 204.
7. Access token após logout deve falhar.
8. Frontend deve compartilhar refresh concorrente.
9. Frontend deve limpar estado quando refresh falhar.
10. Frontend deve continuar sem armazenamento de segredo.

## 10. Arquivos alterados

### 10.1 Frontend

#### Adicionados

- src/lib/session-client.ts;
- src/lib/__tests__/session-client.test.ts;
- src/api/session.ts;
- src/api/firstScreen/first-screen.test.tsx;
- src/components/session-expired-redirect.tsx.

#### Alterados

- src/lib/axios-base-query.ts;
- src/api/firstScreen/first-screen.tsx;
- src/components/account-menu.tsx;
- src/Router.tsx;
- src/@types/auth.ts;
- src/test/server.ts;
- src/components/__tests__/app-topbar.test.tsx;
- src/api/__tests__/remote-endpoints.test.ts;
- READMEs de src/api, src/api/firstScreen, src/components, src/constants, src/context e src/page/auth.

#### Removidos

- src/api/auth.ts;
- src/api/storageProxy.ts;
- src/constants/authorizationConstants.ts;
- src/context/useGlobalContextEXCLUIR.tsx.

#### Testes ajustados por contrato vigente

- src/features/patients/__tests__/patient-create.integration.test.tsx;
- src/features/patients/__tests__/patients-page.integration.test.tsx.

Esses ajustes não alteram o fluxo de autenticação; corrigem expectativas obsoletas que impediam a suíte completa de representar o contrato atual dos pacientes.

### 10.2 Backend

#### Adicionados

- src/main/resources/db/migration/V015__create_auth_sessions.sql;
- src/main/java/com/agendamento/smart/model/session/AuthSession.java;
- src/main/java/com/agendamento/smart/model/session/AuthRefreshToken.java;
- src/main/java/com/agendamento/smart/repository/AuthSessionRepository.java;
- src/main/java/com/agendamento/smart/repository/AuthRefreshTokenRepository.java;
- src/main/java/com/agendamento/smart/service/AuthSessionService.java;
- src/main/java/com/agendamento/smart/dtos/UserLoginResponse.java.

#### Alterados

- AuthenticationController.java;
- LoginResponseDTO.java;
- TokenService.java;
- SecurityFilter.java;
- SecurityConfiguration.java;
- application.yaml;
- application-prod.yaml;
- documentação de autenticação e recursos;
- testes de cookie, escopo e helpers de integração.

## 11. Testes e validações executados

### 11.1 Frontend

Comandos e resultado:

~~~text
npm run test -- --reporter=dot
PASS — 161 testes em 23 arquivos.
~~~

~~~text
Recorte final do fluxo de sessão
PASS — 14 testes.
~~~

~~~text
npm run lint
PASS
~~~

~~~text
npm run build
PASS
~~~

O build apresentou apenas o aviso conhecido de chunk acima de 500 kB; não houve falha de compilação.

Coverage:

~~~text
npm run test:coverage -- --reporter=dot
160 testes executados e aprovados.
Código de saída 1 por threshold global preexistente de branches:
threshold configurado: 85%
medição atual: 77,69%
~~~

A falha do comando de coverage não foi causada por teste funcional vermelho. O threshold global já exigia mais cobertura de branches do que a medição atual.

### 11.2 Backend

~~~text
./mvnw -q -Dtest=AuthenticationCookieIntegrationTest test
PASS
~~~

~~~text
./mvnw -q test
PASS — suíte completa.
~~~

~~~text
./mvnw -q package -DskipTests
PASS
~~~

O teste de integração de autenticação cobre:

- registro de uma clínica de teste;
- login em profile de produção;
- presença de Secure e HttpOnly;
- emissão simultânea de jwt e refresh_token;
- ausência de $.token;
- uso do access cookie em /auth/me;
- refresh com rotação;
- refresh antigo rejeitado;
- logout com expiração de cookie;
- logout repetido idempotente;
- access cookie antigo rejeitado depois do logout;
- logout sem cookie;
- refresh sem cookie.

### 11.3 OpenSpec e integridade do diff

Em ambos os repositórios:

~~~text
openspec validate implementar-logout-e-refresh-token --strict
PASS
~~~

Também foi executado:

~~~text
git diff --check
PASS
~~~

As tarefas de openspec/changes/implementar-logout-e-refresh-token/tasks.md ficaram marcadas como concluídas nos dois repositórios.

## 12. Procedimento de publicação

A ordem recomendada é:

1. aplicar a migration no backend via Flyway;
2. publicar o backend com /auth/login, /auth/refresh e /auth/logout;
3. confirmar JWT_SECRET e os valores de cookie do ambiente;
4. confirmar CORS com a origem exata do frontend;
5. publicar o frontend com VITE_API_URL apontando para essa API;
6. executar login, refresh e logout em ambiente de homologação;
7. somente depois arquivar a change OpenSpec.

### Variáveis de ambiente do backend

Obrigatória:

~~~text
JWT_SECRET=<segredo-forte-do-ambiente>
~~~

Opcionais:

~~~text
JWT_COOKIE_SECURE=true|false
JWT_COOKIE_SAME_SITE=Lax|Strict|None
JWT_ACCESS_COOKIE_NAME=jwt
JWT_REFRESH_COOKIE_NAME=refresh_token
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
~~~

### Compatibilidade de rollout

O contrato de login mudou de forma incompatível para clientes que esperavam token no JSON. Frontend e backend devem ser publicados como par. Uma versão antiga do frontend pode continuar esperando um campo que não existe, e uma versão antiga do backend não oferece refresh/logout persistido.

## 13. Rollback

O rollback deve reverter frontend e backend em conjunto.

Cuidados:

- não remover as tabelas de sessão por rollback automático;
- a migration não apaga tabelas existentes;
- a versão antiga do backend não interpreta as sessões novas;
- a versão antiga do frontend não deve ser mantida indefinidamente contra o novo contrato de login;
- se houver necessidade operacional de voltar, limpar cookies do navegador durante a validação e exigir novo login.

## 14. Checklist manual de homologação

- [ ] Abrir / sem sessão e confirmar redirecionamento para /sign-in.
- [ ] Fazer login e confirmar que a resposta não contém token.
- [ ] Confirmar no navegador que jwt e refresh_token são HttpOnly.
- [ ] Confirmar que o frontend não lê os cookies de sessão.
- [ ] Abrir uma tela autenticada e confirmar GET /auth/me.
- [ ] Simular ou aguardar expiração do access token.
- [ ] Confirmar uma chamada a /auth/refresh e repetição da requisição original.
- [ ] Disparar várias chamadas simultâneas após expiração e confirmar um único refresh.
- [ ] Fazer o refresh novamente usando o token anterior e confirmar 401.
- [ ] Confirmar que replay revoga a sessão.
- [ ] Abrir o menu de conta e confirmar a ação Sair.
- [ ] Clicar em Sair e confirmar POST /auth/logout.
- [ ] Confirmar limpeza dos dois cookies com Max-Age=0.
- [ ] Confirmar limpeza dos dados RTK Query.
- [ ] Confirmar navegação para /sign-in.
- [ ] Repetir logout sem cookies e confirmar 204.
- [ ] Tentar acessar /auth/me com o access cookie antigo e confirmar 401.
- [ ] Repetir os cenários em localhost e produção, respeitando Secure e SameSite.

## 15. OpenSpec da implementação

Os artefatos da change estão em:

- frontend: openspec/changes/implementar-logout-e-refresh-token;
- backend: ../../api-agendamento-smart-api/agendamento-smart-api/openspec/changes/implementar-logout-e-refresh-token.

Arquivos principais da change:

- proposal.md: motivação, escopo e impacto;
- design.md: decisões, alternativas descartadas, riscos e migração;
- specs/access-session-baseline/spec.md: contrato de sessão, refresh, expiração e ausência de segredos;
- specs/application-shell-baseline/spec.md: comportamento do menu de conta;
- tasks.md: execução e verificações.

Validação final:

~~~text
openspec validate implementar-logout-e-refresh-token --strict
~~~

Resultado: aprovado nos dois repositórios.

## 16. Resultado final

O fluxo agora possui uma separação clara entre access token e refresh token, com cookies HttpOnly, sessão persistida, rotação e revogação server-side. O botão Sair encerra a sessão tanto no backend quanto no estado do frontend. A aplicação também consegue atravessar a expiração normal do access token sem exigir login novamente, mas abandona com segurança para /sign-in quando a sessão não puder ser renovada.

O ponto mais importante para manutenção futura é preservar a coordenação entre os dois repositórios: qualquer alteração em nomes de cookies, TTLs, status HTTP, formato do login ou política de CORS deve ser atualizada simultaneamente no backend, no cliente de sessão, nos mocks e nos testes de integração.

## 17. Anexo — arquivos centrais completos

Esta seção reúne os arquivos backend centrais completos, para que a implementação possa ser revisada sem depender de reconstrução dos trechos anteriores.

### 17.1 AuthenticationController.java

~~~java
package com.agendamento.smart.controller.auth;

import com.agendamento.smart.dtos.AuthenticationDTO;
import com.agendamento.smart.dtos.LoginResponseDTO;
import com.agendamento.smart.dtos.UserLoginResponse;
import com.agendamento.smart.model.user.User;
import com.agendamento.smart.model.user.dto.UserProfileResponse;
import com.agendamento.smart.model.user.dto.UserListResponse;
import com.agendamento.smart.repository.UserRepository;
import com.agendamento.smart.service.AuthSessionService;
import com.agendamento.smart.service.UserService;
import com.agendamento.smart.repository.UnitRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = {
        "https://agendamentos-smart.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
})
@RestController
@RequestMapping("auth")
public class AuthenticationController {
    @Value("${api.security.cookie.same-site:Lax}")
    String jwtCookieSameSite;
    @Value("${api.security.cookie.access-name:jwt}")
    String accessCookieName;
    @Value("${api.security.cookie.refresh-name:refresh_token}")
    String refreshCookieName;
    @Value("${api.security.token.access-ttl:15m}")
    Duration accessCookieTtl;
    @Value("${api.security.token.refresh-ttl:30d}")
    Duration refreshCookieTtl;

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UnitRepository unitRepository;
    private final AuthSessionService authSessionService;
    private final boolean jwtCookieSecure;

    public AuthenticationController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            UserService userService,
            UnitRepository unitRepository,
            AuthSessionService authSessionService,
            @Value("${api.security.cookie.secure:false}") boolean jwtCookieSecure) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userService = userService;
        this.unitRepository = unitRepository;
        this.authSessionService = authSessionService;
        this.jwtCookieSecure = jwtCookieSecure;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @RequestBody @Valid AuthenticationDTO data,
            HttpServletResponse response) {
        var credentials = new UsernamePasswordAuthenticationToken(
                data.login(), data.password());
        var auth = authenticationManager.authenticate(credentials);

        User user = (User) auth.getPrincipal();
        AuthSessionService.SessionTokens tokens = authSessionService.create(user);
        addSessionCookies(response, tokens);

        return ResponseEntity.ok(new LoginResponseDTO(new UserLoginResponse(
                user.getId(),
                user.getLogin(),
                user.getRole(),
                user.getClinic().getId(),
                user.getClinicUnit().getId())));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = cookieValue(request, refreshCookieName);
        try {
            AuthSessionService.SessionTokens tokens =
                    authSessionService.refresh(refreshToken);
            addSessionCookies(response, tokens);
            return ResponseEntity.noContent().build();
        } catch (AuthSessionService.InvalidSessionException exception) {
            clearSessionCookies(response);
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        authSessionService.logout(cookieValue(request, refreshCookieName));
        clearSessionCookies(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserListResponse>> list(
            @RequestParam(required = false) UUID unitId,
            Authentication authentication) {
        User principal = (User) authentication.getPrincipal();
        List<User> users;
        if (unitId == null) {
            users = userRepository.findAllByClinicId(principal.getClinic().getId());
        } else {
            unitRepository.findByIdAndClinicId(unitId, principal.getClinic().getId())
                    .orElseThrow(com.agendamento.smart.controller.exception.DomainException::tenantResourceNotFound);
            users = userRepository.findAllByClinicIdAndClinicUnitId(
                    principal.getClinic().getId(), unitId);
        }
        return ResponseEntity.ok(users.stream().map(this::toListResponse).toList());
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me(Authentication authentication) {
        UserProfileResponse profile = userService.getUserProfile(authentication);
        return ResponseEntity.ok(profile);
    }

    private UserListResponse toListResponse(User user) {
        return new UserListResponse(
                user.getId(),
                user.getLogin(),
                user.getRole(),
                user.getClinic().getId(),
                user.getClinicUnit() == null ? null : user.getClinicUnit().getId(),
                user.getClinicUnit() == null ? null : user.getClinicUnit().getName());
    }

    private void addSessionCookies(
            HttpServletResponse response,
            AuthSessionService.SessionTokens tokens) {
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
                accessCookieName, tokens.accessToken(), accessCookieTtl).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
                refreshCookieName, tokens.refreshToken(), refreshCookieTtl).toString());
    }

    private void clearSessionCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
                accessCookieName, "", Duration.ZERO).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie(
                refreshCookieName, "", Duration.ZERO).toString());
    }

    private ResponseCookie sessionCookie(
            String name,
            String value,
            Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(jwtCookieSecure)
                .path("/")
                .maxAge(maxAge)
                .sameSite(jwtCookieSameSite)
                .build();
    }

    private String cookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
~~~

### 17.2 SecurityConfiguration.java

~~~java
package com.agendamento.smart.infra.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/logout").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/patient/list").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.GET, "/api/appointments").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.GET, "/auth/me").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.POST, "/auth/register/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "https://agendamentos-smart.vercel.app",
                "http://localhost:3000",
                "http://localhost:5173"
        ));
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
~~~

### 17.3 Estado das partes preservadas

As regras de domínio, autorização por papel, escopo de clínica/unidade, endpoints de pacientes, agenda e demais funcionalidades não foram alteradas por esta change. O impacto foi concentrado no ciclo de sessão e nas integrações que dependiam do contrato antigo de login.



