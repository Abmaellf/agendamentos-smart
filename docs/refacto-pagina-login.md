# Refatoração da página de login

## Identificação da alteração

| Item | Valor |
| --- | --- |
| Branch | `refacto/pagina-login` |
| Commit-base observado | `6ff464d` |
| Rotas envolvidas | `/sign-in` e `/sign-up` |
| Casca compartilhada | `src/_layout/auth.tsx` |
| API preservada | `POST /auth/login` |
| Referências visuais | `Login Equilíbrio Fisioterapia & Pilates.png` e `Equilíbrio-logoff.png` |
| Interpretação da segunda referência | A imagem chamada “logoff” representa a tela de cadastro, aplicada à rota `/sign-up` |

Este documento descreve a implementação realizada na branch e serve como guia
para revisão, manutenção e reprodução da refatoração. Os trechos “antes” são
do estado existente no commit-base; os trechos “agora” representam o código
implementado na branch.

> Estado importante: a branch contém alterações de trabalho não commitadas. O
> conteúdo deste documento descreve o código atual do working tree, não um
> commit publicado.

## 1. Objetivo da refatoração

Antes, as telas públicas eram páginas genéricas, com uma grade simples de duas
colunas, pouco conteúdo visual e algumas inconsistências de comportamento. A
referência da Equilíbrio Fisioterapia & Pilates exige uma experiência de marca
com:

- painel institucional verde com imagem de Pilates;
- logotipo e nome da clínica;
- mensagem “Crie o futuro da sua Clínica”;
- cartões de benefícios;
- cartão claro para login ou cadastro;
- campos com ícones e estados de foco;
- ações “Novo Usuário” e “Efetuar login”;
- composição responsiva para telas compactas;
- conteúdo acessível para teclado e leitor de tela.

A refatoração preserva o que já funcionava: o login continua enviando `login`
e `password` para `POST /auth/login`, mostra sucesso/erro e navega para
`/appointments` quando a API aceita as credenciais.

## 2. Visão geral: onde era assim, agora é assim

### 2.1 Arquitetura visual

#### Antes

O layout de autenticação era uma grade genérica e não possuía uma identidade
visual reutilizável:

```tsx
export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-2">
      <div className="border-foreground/5 bg-muted text-muted-foreground flex h-full flex-col justify-between border-r p-10">
        <div className="text-foreground flex items-center gap-3 text-lg">
          <span className="font-semibold">Crie o futuro de sua Clínica</span>
        </div>

        <footer>
          Gestão de agendamento &copy; Equilibrio Fisioterapia & Pilates -{' '}
          {new Date().getFullYear()}
        </footer>
      </div>

      <div className="flex flex-col items-center justify-center">
        <Outlet />
      </div>
    </div>
  )
}
```

Problemas do estado anterior:

1. O painel esquerdo não apresentava a imagem da clínica.
2. Não havia marca visual compartilhada entre login e cadastro.
3. O lado direito não possuía cartão, fundo decorativo nem ação superior.
4. O layout usava duas colunas fixas, sem estratégia para telas estreitas.
5. O texto de marca estava separado do conteúdo visual esperado pela referência.

#### Agora

O layout passou a ser uma casca única para as duas rotas. Ele identifica a rota
atual com `useLocation()` e alterna a ação superior automaticamente:

```tsx
export function AuthLayout() {
  const location = useLocation()
  const isSignUp = location.pathname === '/sign-up'

  return (
    <div
      data-testid="auth-shell"
      className="relative min-h-screen overflow-x-hidden bg-[#edfafa] text-[#063f35]"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="relative hidden min-h-screen overflow-hidden bg-[#005441] text-white lg:flex lg:w-[51%] lg:flex-col lg:justify-between">
          {/* imagem, overlay, curvas, marca, mensagem, benefícios e rodapé */}
        </aside>

        <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-12 lg:py-16">
          <div className="relative z-10 flex w-full max-w-[670px] flex-col items-center">
            <div className="mb-6 flex w-full justify-end">
              <Link to={isSignUp ? '/sign-in' : '/sign-up'}>
                {isSignUp ? 'Efetuar login' : 'Novo Usuário'}
              </Link>
            </div>

            <div className="mb-5 self-start lg:hidden">
              <BrandLogo compact />
            </div>

            <div className="w-full rounded-[2rem] bg-white/95 p-6 sm:p-10 lg:p-12">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
```

A implementação completa está em
[src/_layout/auth.tsx](../src/_layout/auth.tsx). O `Outlet` continua sendo o
ponto de inserção do conteúdo de login ou cadastro; portanto, as páginas não
duplicam o painel institucional.

### 2.2 Diferenciação entre login e cadastro

O layout usa a rota atual somente para elementos compartilhados:

```tsx
const isSignUp = location.pathname === '/sign-up'

<Link to={isSignUp ? '/sign-in' : '/sign-up'}>
  {isSignUp ? <LogIn /> : <UserPlus />}
  {isSignUp ? 'Efetuar login' : 'Novo Usuário'}
</Link>
```

O conteúdo específico continua nas páginas:

- `SignIn` controla autenticação, loading, foco, senha e mensagens;
- `SignUp` controla os campos visuais do cadastro;
- `AuthLayout` controla o ambiente visual, a ação de troca de tela e a
  responsividade da composição.

## 3. Logo e identidade visual

### 3.1 Estado anterior

Não havia um componente de marca reutilizável. O nome aparecia como texto
solto dentro do layout e não existia uma representação semântica do logo.

### 3.2 Estado atual

Foi criado o componente
[src/components/auth/brand-logo.tsx](../src/components/auth/brand-logo.tsx).
Ele usa SVG inline para não depender de um screenshot completo e fornece uma
identificação acessível:

```tsx
interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  inverse?: boolean
  compact?: boolean
}

export function BrandLogo({
  inverse = false,
  compact = false,
  className,
  ...props
}: BrandLogoProps) {
  return (
    <div
      role="img"
      aria-label="Equilíbrio Fisioterapia & Pilates"
      className={cn(
        'flex items-center gap-3',
        compact ? 'gap-2' : 'gap-4',
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 72 72"
        className={cn(compact ? 'size-12' : 'size-16', 'shrink-0')}
        fill="none"
      >
        <circle
          cx="36"
          cy="36"
          r="29"
          stroke={inverse ? '#31e86c' : '#16c95e'}
          strokeWidth="4"
        />
        <circle cx="36" cy="23" r="6" fill={inverse ? '#31e86c' : '#16c95e'} />
        <path
          d="M35.8 31c-7.9 0-13.7 4.7-17.1 11.9 5.5-1.1 10.4 1.1 14.2 6.4 1.3-5.7 1.6-11.2 2.9-18.3Z"
          fill={inverse ? '#31e86c' : '#16c95e'}
        />
        <path
          d="M36.2 31c7.9 0 13.7 4.7 17.1 11.9-5.5-1.1-10.4 1.1-14.2 6.4-1.3-5.7-1.6-11.2-2.9-18.3Z"
          fill={inverse ? '#31e86c' : '#16c95e'}
        />
      </svg>

      <span className="leading-none">
        <span className={cn('block font-semibold', inverse ? 'text-white' : 'text-[#064d3d]')}>
          Equilíbrio
        </span>
        <span className={cn('mt-1 block font-medium', inverse ? 'text-white' : 'text-[#064d3d]')}>
          Fisioterapia &amp; Pilates
        </span>
      </span>
    </div>
  )
}
```

O componente possui duas variações:

- `inverse`: texto branco e verde-limão para uso no painel escuro;
- `compact`: dimensões reduzidas para uso no cartão e no layout móvel.

### 3.3 Imagem existente reutilizada

O asset `src/assets/img_pilates.png` já existia no projeto e passou a ser
consumido pelo `AuthLayout`:

```tsx
import pilatesImage from '@/assets/img_pilates.png'

<img
  src={pilatesImage}
  alt=""
  aria-hidden="true"
  className="absolute inset-0 size-full object-cover opacity-25 mix-blend-screen"
/>
```

Como a imagem é decorativa, `alt=""` e `aria-hidden="true"` evitam que o leitor
de tela anuncie uma imagem sem informação adicional. O conteúdo importante fica
em HTML semântico por cima da imagem.

## 4. Refatoração da tela de login

### 4.1 Formulário antes da refatoração

O login anterior tinha largura fixa, título vazio, estilos genéricos e campos
sem a composição visual da referência:

```tsx
<div className="flex w-[350px] flex-col justify-center gap-6">
  <div className="flex flex-col gap-2 text-center">
    <h1 className="text-2xl font-semibold tracking-tight"></h1>
    <p className="text-muted-foreground text-sm">
      Acompanhe suas vendas pelo painel do parceiro! s
    </p>
  </div>

  <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-4">
    <div className="space-y-2">
      <Label htmlFor="email">Seu e-mail</Label>
      <input id="email" type="email" {...register('login')} />
    </div>

    <div className="space-y-2">
      <Label htmlFor="password">Senha</Label>
      <input id="password" type="password" {...register('password')} />
    </div>

    <Button disabled={isSubmitting} className="w-full" type="submit">
      Acessar painel
    </Button>
  </form>
</div>
```

Também existia um problema de segurança: o token e o usuário retornados pela
API eram impressos no console:

```tsx
console.log(response.token, 'auth/signin')
console.log(response.user, 'auth/signin')
```

Esses logs foram removidos. O login continua usando a resposta para concluir o
fluxo, mas não expõe token, usuário ou dados pessoais no console.

### 4.2 Formulário agora

O formulário atual tem título, subtítulo, marca, ícones, autocomplete, foco,
controle de senha, checkbox, recuperação visual de senha e botão com gradiente:

```tsx
export function SignIn() {
  const navigate = useNavigate()
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { isSubmitting } } =
    useForm<SignInFormValues>()
  const [authenticate] = useSignInMutation()
  const emailField = register('login')

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  async function handleLogin(data: SignInFormValues) {
    try {
      await authenticate({ login: data.login, password: data.password }).unwrap()
      navigate('/appointments')
      toast.success('Conectado com sucesso')
    } catch {
      toast.error('Credenciais inválidas')
    }
  }
```

O contrato HTTP não foi alterado. A chamada continua sendo feita pelo hook
existente:

```tsx
<form onSubmit={handleSubmit(handleLogin)} className="mt-9 w-full space-y-5">
  <Input
    id="email"
    type="email"
    placeholder="seu.email@clinicaequilibrio.com"
    autoComplete="email"
    aria-label="Seu e-mail"
    {...emailField}
    ref={(element) => {
      emailField.ref(element)
      emailInputRef.current = element
    }}
  />

  <Input
    id="password"
    type={showPassword ? 'text' : 'password'}
    placeholder="Senha"
    autoComplete="current-password"
    aria-label="Senha"
    {...register('password')}
  />

  <Button disabled={isSubmitting} type="submit">
    {isSubmitting ? <span className="animate-spin" /> : <LogIn />}
    Acessar painel
  </Button>
</form>
```

### 4.3 Estado de senha

O ícone de olho alterna somente a apresentação do valor digitado; ele não
altera o payload enviado:

```tsx
<button
  type="button"
  aria-label={showPassword ? 'Ocultar valor digitado' : 'Mostrar valor digitado'}
  onClick={() => setShowPassword((visible) => !visible)}
>
  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
</button>
```

O checkbox “Lembrar-me neste dispositivo” é visual nesta etapa. Não foi criado
um armazenamento novo nem uma mudança de contrato para persistência de sessão.
Da mesma forma, “Esqueceu sua senha?” é apresentado conforme a referência,
mas não inicia recuperação de senha porque essa funcionalidade está fora do
escopo desta branch.

## 5. Refatoração da tela de cadastro

### 5.1 Comportamento anterior incorreto

Antes, o cadastro tinha uma navegação inconsistente para `/appointments` e
usava `redirect()` dentro de um `onClick`, além de envolver o botão em um link:

```tsx
function onSubmit() {
  return redirect('/appointments')
}

<Link to="/appointments">
  <Button onClick={onSubmit} className="w-full" type="submit">
    Salvar cadastro
  </Button>
</Link>
```

Esse comportamento representava um cadastro como concluído sem enviar dados,
sem criar clínica e sem validar qualquer campo.

### 5.2 Comportamento atual

Agora a tela apresenta somente a intenção visual de cadastro, conforme o
escopo aprovado. O botão não cria uma sessão nem navega para uma área interna:

```tsx
export function SignUp() {
  return (
    <>
      <Helmet title="Cadastrar usuário" />
      <div className="flex flex-col items-center">
        <BrandLogo compact className="mb-6" />

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#064b3d]">
            Faça seu cadastro
          </h1>
          <p className="mt-2 text-[#315d58]">
            Crie sua clínica digital personalizada e comece a gerenciar seus
            atendimentos agora mesmo!
          </p>
        </div>

        <form
          className="mt-7 w-full space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          {/* Nome da clínica */}
          {/* Seu e-mail */}
          {/* CPF ou CNPJ */}

          <Button type="button">
            <UserPlus aria-hidden="true" />
            Salvar cadastro
          </Button>
        </form>
      </div>
    </>
  )
}
```

Os campos atuais são:

```tsx
<Input
  id="clinic-name"
  type="text"
  placeholder="Ex.: Clínica Equilíbrio"
  autoComplete="organization"
/>

<Input
  id="sign-up-email"
  type="email"
  placeholder="Ex.: contato@clinicaequilibrio.com"
  autoComplete="email"
/>

<Input
  id="cpf-cnpj"
  type="text"
  placeholder="Digite o CPF ou CNPJ"
  inputMode="numeric"
/>
```

A navegação de retorno é fornecida pelo controle superior do `AuthLayout`:

```tsx
<Link to="/sign-in">
  <LogIn aria-hidden="true" />
  Efetuar login
</Link>
```

### 5.3 O que o cadastro ainda não faz

Nesta branch, o cadastro não:

- chama `registerUser`;
- envia `POST` para criar clínica;
- cria usuário `ADMIN`;
- valida CPF/CNPJ no backend;
- valida e-mail;
- cria sessão;
- navega automaticamente para `/appointments`.

Esses comportamentos devem ser implementados em uma change própria, com
contrato de API e regras de validação definidos.

## 6. Responsividade e acessibilidade

### 6.1 Estratégia de layout

Em viewport ampla:

- o painel institucional ocupa aproximadamente 51% da tela;
- o formulário fica em um cartão claro na área direita;
- o botão de alternância fica no topo direito;
- a imagem de Pilates recebe overlay escuro para manter contraste;
- as curvas verdes são elementos decorativos sem conteúdo acessível.

Em viewport compacta:

- o painel esquerdo de desktop é ocultado;
- a marca compacta aparece acima do cartão;
- o botão “Novo Usuário” ou “Efetuar login” continua acessível;
- o cartão ocupa a largura disponível com `px-4` e `max-w`;
- `overflow-x-hidden` evita rolagem horizontal causada pelos elementos
  decorativos;
- os campos continuam acessíveis por label e `aria-label`.

### 6.2 Pontos de acessibilidade implementados

- `BrandLogo` possui `role="img"` e `aria-label`;
- imagens decorativas têm `alt=""` e `aria-hidden="true"`;
- labels estão ligados aos campos via `htmlFor`/`id`;
- ícones funcionais possuem nomes acessíveis;
- ícones decorativos têm `aria-hidden="true"`;
- foco inicial é aplicado ao campo de e-mail;
- botões possuem `type` explícito;
- estados de foco usam `focus-visible:ring`;
- o botão de loading fica desabilitado durante a autenticação;
- o erro de credenciais é comunicado por toast.

## 7. Paleta e elementos visuais

| Elemento | Valor usado | Aplicação |
| --- | --- | --- |
| Verde escuro principal | `#005441` | painel institucional |
| Verde de texto | `#064b3d` | títulos do cartão |
| Verde de ação | `#007d53` | início do gradiente dos botões |
| Verde-limão | `#5acb32` | final do gradiente dos botões |
| Verde de destaque | `#2ee86d` | palavra “sua Clínica” |
| Fundo claro | `#edfafa` | área direita |
| Borda dos campos | `#9cd9c6` | inputs |
| Superfície do cartão | `white/95` | cartão dos formulários |

Os elementos decorativos são feitos com classes Tailwind: gradientes, bordas,
`rounded-[50%]`, rotações e posicionamento absoluto. Eles ficam atrás do
conteúdo com `z-index` inferior e não interferem no foco ou na leitura.

## 8. Testes adicionados e alterados

### 8.1 Teste de login existente preservado

O teste original continua verificando o payload e o sucesso:

```tsx
expect(body).toEqual({
  login: 'ana@clinica.test',
  password: 'secret',
})
```

### 8.2 Novos cenários de login

Foram adicionados cenários para:

- erro `401` retornado pela API;
- toast “Credenciais inválidas”;
- botão desabilitado durante uma resposta lenta;
- preservação do payload `{ login, password }`.

Trecho representativo:

```tsx
it('exibe erro quando a API recusa as credenciais', async () => {
  server.use(
    http.post('http://localhost:8080/auth/login', () =>
      HttpResponse.json(
        { message: 'invalid credentials' },
        { status: 401 },
      ),
    ),
  )

  // preenchimento e envio do formulário

  expect(await screen.findByText(/credenciais inválidas/i)).toBeVisible()
})
```

### 8.3 Teste da casca pública e cadastro

Foi criado
[public-authentication.test.tsx](../src/page/auth/__tests__/public-authentication.test.tsx)
para renderizar as rotas dentro do `AuthLayout` e verificar:

```tsx
expect(screen.getByTestId('auth-shell')).toHaveClass('overflow-x-hidden')
expect(screen.getAllByRole('img', {
  name: 'Equilíbrio Fisioterapia & Pilates',
})).toHaveLength(3)
expect(screen.getByRole('heading', {
  name: 'Acesse sua conta',
})).toBeVisible()
```

Também é verificado que:

- `/sign-up` apresenta os três campos;
- “Salvar cadastro” existe como botão visual;
- “Efetuar login” retorna para `/sign-in`;
- a casca contém a marca, benefícios e rodapé;
- a composição declara `overflow-x-hidden`.

Arquivos de teste:

- [sign-in.test.tsx](../src/page/auth/__tests__/sign-in.test.tsx);
- [public-authentication.test.tsx](../src/page/auth/__tests__/public-authentication.test.tsx).

## 9. Documentação de módulo e assets

O README de autenticação foi atualizado em
[src/page/auth/README.md](../src/page/auth/README.md) para registrar:

- a responsabilidade do `AuthLayout`;
- o fluxo real de `/sign-in`;
- o cadastro como tela visual sem persistência;
- a remoção dos logs de token e usuário;
- o texto visual mantido por compatibilidade com a referência.

O README de assets foi atualizado em
[src/assets/README.md](../src/assets/README.md) para registrar que
`img_pilates.png` agora é consumidor do `AuthLayout`.

## 10. Passo a passo para reproduzir a alteração

### Passo 1 — entrar na branch

```bash
git switch refacto/pagina-login
```

### Passo 2 — instalar dependências

```bash
npm install
```

### Passo 3 — configurar a API

Criar ou conferir `.env.local`:

```dotenv
VITE_API_URL="http://localhost:8080"
```

### Passo 4 — iniciar o frontend

```bash
npm run dev -- --host 0.0.0.0
```

### Passo 5 — abrir as telas

```text
http://localhost:3000/sign-in
http://localhost:3000/sign-up
```

### Passo 6 — validar o fluxo de login

1. Acesse `/sign-in`.
2. Confirme a presença da marca e do painel institucional.
3. Preencha o e-mail e a senha.
4. Clique em “Acessar painel”.
5. Confirme que a API recebe `{ login, password }`.
6. Em sucesso, confirme a navegação para `/appointments` e o toast.
7. Em erro, confirme o toast “Credenciais inválidas”.
8. Clique no olho da senha e confirme a alternância de visibilidade.

### Passo 7 — validar o fluxo de cadastro visual

1. Acesse `/sign-up` ou clique em “Novo Usuário”.
2. Confirme os campos “Nome da clínica”, “Seu e-mail” e “CPF ou CNPJ”.
3. Confirme o botão “Salvar cadastro”.
4. Confirme que “Efetuar login” retorna para `/sign-in`.
5. Confirme que “Salvar cadastro” não cria sessão nem chama endpoint nesta
   versão.

## 11. Comandos de validação executados

```bash
npm run lint
npm run test -- src/page/auth/__tests__/sign-in.test.tsx src/page/auth/__tests__/public-authentication.test.tsx --reporter=dot
npm run build
openspec validate atualizar-telas-publicas-equilibrio --strict
```

Resultados registrados:

- lint aprovado;
- 2 arquivos de teste aprovados;
- 5 testes direcionados aprovados;
- build TypeScript/Vite aprovado;
- change OpenSpec validada com `--strict`;
- screenshots conferidos em `1706 × 922` e `390 × 844` para login e cadastro;
- nenhum overflow horizontal observado nas capturas.

## 12. Limites e próximos passos

Esta refatoração é visual e de experiência de entrada. As seguintes evoluções
continuam pendentes:

1. Implementar o cadastro real da clínica com contrato HTTP aprovado.
2. Persistir a opção “Lembrar-me neste dispositivo” quando houver regra de
   sessão definida.
3. Implementar recuperação de senha.
4. Tornar logo, nome, cores e imagem configuráveis por clínica/tenant.
5. Criar uma rota de logout caso o produto realmente precise de uma tela de
   saída; a imagem denominada `Equilíbrio-logoff.png` não foi tratada como
   logout porque seu conteúdo é um formulário de cadastro.
6. Adicionar testes automatizados de screenshot caso o projeto adote uma
   ferramenta de browser visual no CI.

## 13. Referência rápida dos arquivos

- [Casca de autenticação](../src/_layout/auth.tsx)
- [Logo reutilizável](../src/components/auth/brand-logo.tsx)
- [Tela de login](../src/page/auth/sign-in.tsx)
- [Tela de cadastro](../src/page/auth/sign-up.tsx)
- [Testes de login](../src/page/auth/__tests__/sign-in.test.tsx)
- [Testes da experiência pública](../src/page/auth/__tests__/public-authentication.test.tsx)
- [README do módulo](../src/page/auth/README.md)
- [README de assets](../src/assets/README.md)
- [Change OpenSpec](../openspec/changes/atualizar-telas-publicas-equilibrio/)
