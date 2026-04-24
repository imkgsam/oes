import { requestClient } from '#/api/request';

export namespace PersonalCenterApi {
  export interface LoginMethod {
    label: string;
    type: string;
    value?: string;
  }

  export interface UserProfile {
    loginEmail?: string;
    loginMethods: LoginMethod[];
    loginPhone?: string;
  }

  export interface Role {
    code: string;
    name: string;
    roleId: string;
    scope?: string;
    tenantId?: string;
  }

  export interface AccountContext {
    accountId: string;
    accountName?: string;
    avatar?: string;
    bio?: string;
    displayName?: string;
    roles: Role[];
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: string;
    tenantName?: string;
    workEmail?: string;
    workPhone?: string;
  }

  export interface UpdateAccountProfilePayload {
    avatarAssetId?: string;
    bio?: string;
    displayName?: string;
  }

  export interface UpdateAccountProfileResponse {
    accountContext: AccountContext;
  }

  export interface AvatarAsset {
    assetId: string;
    mimeType: string;
    publicUrl: string;
    size: number;
    status: string;
  }

  export interface UploadAccountAvatarResponse {
    avatarAsset: AvatarAsset;
  }

  export interface SecurityEntry {
    code: string;
    label: string;
    path: string;
  }

  export interface Summary {
    accountContext: AccountContext;
    securityEntries: SecurityEntry[];
    userProfile: UserProfile;
  }
}

// Loads the first-stage personal-center summary for the authenticated operator.
export async function getPersonalCenterApi() {
  return requestClient.get<PersonalCenterApi.Summary>('/auth/personal-center');
}

// Updates the current authenticated account profile in personal-center.
export async function updateAccountProfileApi(payload: PersonalCenterApi.UpdateAccountProfilePayload) {
  return requestClient.request<PersonalCenterApi.UpdateAccountProfileResponse>(
    '/auth/personal-center/account-profile',
    {
      data: payload,
      method: 'PATCH',
    },
  );
}

// Uploads one controlled avatar candidate for the current authenticated account.
export async function uploadAccountAvatarApi(file: File) {
  return requestClient.upload<PersonalCenterApi.UploadAccountAvatarResponse>(
    '/auth/personal-center/avatar',
    { file },
  );
}
