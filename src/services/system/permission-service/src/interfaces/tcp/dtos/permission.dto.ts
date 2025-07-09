

export class CheckUserPermissionDto {
  userId: string;
  resource: string;
  action: string;
}

export class CheckUserScopeDto {
  userId: string;
  scope: string;
}