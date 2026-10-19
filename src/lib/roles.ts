type RegistrationRole = 'TENANT' | 'OWNER' | 'AGENT' | 'VENDOR'

export function isRegistrationRole(role: string | undefined): role is RegistrationRole {
  return role === 'TENANT' || role === 'OWNER' || role === 'AGENT' || role === 'VENDOR'
}
