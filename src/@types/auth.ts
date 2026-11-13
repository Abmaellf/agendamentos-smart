export interface SignInBody {
  login: string
  password: string
}

export interface SignInResponse {
  token?: unknown
  user?: unknown
}

export interface SignInFormValues {
  login: string
  password: string
}
