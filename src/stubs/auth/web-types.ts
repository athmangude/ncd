export interface User {
  id: string
  timeJoined?: number
  emails?: string[]
  phoneNumbers?: string[]
  loginMethods?: unknown[]
  [key: string]: unknown
}
