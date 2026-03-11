export type AuthUser = {
  id: string
  email: string
  name: string
  role?: string | null
}

export interface IAuthService {
  validateSession(cookieHeader: string): Promise<AuthUser | null>
}
