import { SetMetadata } from '@nestjs/common';

export const SCOPE_CHECK_KEY = 'scope_check';

export const ScopeCheck = (permission: string, resourceParam?: string) => SetMetadata(SCOPE_CHECK_KEY, { permission, resourceParam: resourceParam })
