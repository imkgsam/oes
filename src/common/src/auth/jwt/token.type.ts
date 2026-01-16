
export enum AccountType {
  USER = 'USER',
  SERVICE = 'SERVICE'
}

interface payloadBase {
  iss: string
  aud: string
  sub: string
  typ: AccountType
  iat: number
  exp: number 


  //   "iss": "...",
  // "aud": "...",
  // "sub": "...",
  // "typ": "...",
  // "ver": 1,
  // "iat": 1700000000,
  // "exp": 1700003600
}