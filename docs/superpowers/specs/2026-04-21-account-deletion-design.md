# Account Deletion Design

## 1. Goal

Add a formal `删除账号` capability for administrator-facing account management.

This design freezes terminal disposal semantics for `account` only:

- hard delete the selected `account`
- never delete the backing `user`
- forbid deleting the current logged-in account
- auto-clean system-owned associations
- block deletion when business-owned associations still exist

This capability is an account lifecycle action, not a substitute for `停用账号`.

## 2. Scope

### In Scope

- administrator-triggered hard deletion of one `account`
- system-scope and tenant-scope operators using the same page model
- current-account self-delete protection
- cross-service cleanup orchestration
- precheck / blocker model for business associations
- audit events for rejected and successful deletion
- admin account-management UI action and confirmation flow

### Out of Scope

- deleting `user`
- deleting service accounts
- batch account deletion
- recycle bin / restore
- forced deletion that bypasses business blockers
- business-domain-specific blocker implementations in every business service

## 3. Frozen Product Decisions

### 3.1 Terminal Semantics

- `删除账号` is a true hard delete for `account`.
- The deleted object is `identity-service.UserAccount`.
- The backing `identity-service.User` must be retained.
- The action is not reversible.

### 3.2 Current Session Protection

- The current logged-in account must not be deletable.
- The delete action should not be rendered for the current account row.
- The back end must still enforce this rule explicitly.

### 3.3 Scope Rules

- Both tenant administrators and system administrators may delete accounts visible in their effective scope.
- Tenant-bound operators may delete only same-tenant accounts.
- System-scope operators may delete any visible account.

### 3.4 Association Handling

- System-owned associations are auto-cleaned by the delete flow.
- Business-owned associations are delete blockers.
- Deletion must fail when business blockers exist.
- No “force delete” bypass exists in this slice.

### 3.5 User Retention

- Even when the deleted account is the user's last account, `user` is still retained.
- Login identities, user-level credentials, and user-level security state are not deleted by account deletion.

## 4. Recommended Architecture

### Approach A: Auth-BFF Orchestrated Formal Account-Deletion Flow (Recommended)

`auth-bff` exposes one delete endpoint and orchestrates:

1. target account lookup
2. scope and self-delete checks
3. deletion-impact precheck
4. auth cleanup
5. permission cleanup
6. identity hard delete

Why this is recommended:

- matches current service ownership
- avoids hiding lifecycle semantics in the frontend
- avoids pretending one service owns all account-adjacent state
- keeps a clean future extension point for business blockers

### Approach B: Identity-Service Local Delete Only

Delete the `UserAccount` directly in `identity-service` and let other services drift or reconcile later.

Why not recommended:

- leaves auth sessions outside the delete boundary
- leaves permission role bindings outside the delete boundary
- violates the project's boundary-first execution discipline

### Approach C: Disable-And-Hide Instead Of Delete

Continue using `停用账号` and remove the row from the UI.

Why not recommended:

- does not satisfy the required hard-delete semantics
- further delays terminal lifecycle truth

## 5. Ownership Model

### 5.1 auth-bff

Owns:

- administrator HTTP contract
- orchestration across downstream system services
- view-model mapping for precheck and delete result

Does not own:

- account master truth
- session persistence
- role-binding persistence

### 5.2 identity-service

Owns:

- `UserAccount` truth
- account-scoped identity relations that live in the identity database
- account deletion precheck entry point and terminal delete command

The identity database already owns relations that can safely cascade with account deletion:

- `UserAccountOrgMembership`
- `AccountContactAsset`

### 5.3 auth-service

Owns:

- account-bound active and persisted session cleanup
- auth audit event detail for session removal

### 5.4 permission-service

Owns:

- account-role bindings cleanup

The existing `setAccountRoles([])` replacement semantics should be reused as the formal role-clearing mechanism.

## 6. Delete Flow

### 6.1 Runtime Flow

Recommended runtime sequence:

1. operator clicks `删除账号`
2. frontend requests delete precheck
3. BFF loads target account basic info
4. BFF rejects:
   - account not found
   - out-of-scope account
   - current logged-in account
5. BFF requests account deletion impact from `identity-service`
6. if impact returns business blockers, BFF returns blocker payload and stops
7. BFF requests `auth-service` to delete all sessions for that account
8. BFF requests `permission-service` to clear all role bindings for that account
9. BFF requests `identity-service` to hard delete the account
10. BFF returns structured delete result
11. UI refreshes the account directory

### 6.2 Failure Model

The delete flow is not a distributed transaction with rollback.

This slice should use a practical ordered cleanup model:

- business blockers are checked before any cleanup happens
- downstream cleanups run before the final identity delete
- final identity delete is the last step

Why this order is preferred:

- if identity delete runs first, downstream cleanup may lose the target anchor
- if auth or permission cleanup fails, account remains present and retryable
- final state remains operationally understandable

## 7. Contracts

### 7.1 Auth-BFF HTTP

Add:

- `GET /auth/admin/accounts/:accountId/deletion-impact`
- `DELETE /auth/admin/accounts/:accountId`

#### `GET /auth/admin/accounts/:accountId/deletion-impact`

Purpose:

- load deletion blockers and cleanup preview before confirmation

Recommended response:

```json
{
  "accountId": "account-1",
  "canDelete": true,
  "userRetained": true,
  "cleanupPlan": {
    "willDeleteSessions": true,
    "willClearRoles": true,
    "willDeleteOrgMemberships": true,
    "willDeleteContactAssets": true
  },
  "blockingReasons": []
}
```

#### `DELETE /auth/admin/accounts/:accountId`

Purpose:

- execute the formal account hard-delete flow

Recommended response:

```json
{
  "accountId": "account-1",
  "success": true,
  "deletedSessionCount": 3,
  "clearedRoleCount": 2,
  "deletedOrgMembershipCount": 1,
  "deletedContactAssetCount": 2,
  "userRetained": true
}
```

`clearedRoleCount` should mean the number of role bindings that existed before the role-clear operation ran.

### 7.2 identity-service gRPC

Add to identity management surface:

- `GetAccountDeletionImpact(GetAccountDeletionImpactRequest) returns (GetAccountDeletionImpactResponse)`
- `DeleteAccount(DeleteAccountRequest) returns (DeleteAccountResponse)`

#### `GetAccountDeletionImpactRequest`

- `account_id`

#### `GetAccountDeletionImpactResponse`

- `account_id`
- `can_delete`
- `blocking_reasons[]`
- `org_membership_count`
- `contact_asset_count`
- `user_retained`

#### `DeleteAccountRequest`

- `account_id`
- `operator_id`

#### `DeleteAccountResponse`

- `account`
- `deleted_org_membership_count`
- `deleted_contact_asset_count`
- `user_retained`

### 7.3 auth-service gRPC

This slice can reuse the existing:

- `AdminDeleteAccountSessions`

No new auth deletion RPC is strictly required for phase 1 account deletion.

### 7.4 permission-service gRPC

This slice can reuse the existing:

- `SetAccountRoles`

by sending an empty role list for the target account scope.

No new permission deletion RPC is required for phase 1 account deletion.

## 8. Blocker Model

### 8.1 System-Owned Associations

These are auto-clean associations and must not block deletion:

- auth sessions
- account-role bindings
- account org memberships
- account contact assets

### 8.2 Business-Owned Associations

These are blockers.

Phase 1 contract should already model blockers explicitly, even if the initial blocker set is small or empty.

Recommended blocker payload:

- `resourceType`
- `resourceCount`
- `message`

Example:

```json
{
  "resourceType": "crm_owner_assignment",
  "resourceCount": 4,
  "message": "该账号仍关联 4 条 CRM 负责人数据，请先解除关联。"
}
```

### 8.3 Why Precheck Belongs In Identity Lifecycle Surface

The project does not yet have one unified cross-domain business-ownership checker for account deletion.

Therefore phase 1 should:

- freeze a formal precheck contract now
- keep business blocker extension behind that contract
- avoid hardcoding blocker lists in frontend or BFF

This keeps deletion semantics stable while business services can integrate gradually later.

## 9. Error Semantics

The delete flow should normalize into stable business-facing errors:

- `ACCOUNT_NOT_FOUND`
- `ACCOUNT_DELETE_CURRENT_FORBIDDEN`
- `ACCOUNT_DELETE_FORBIDDEN`
- `ACCOUNT_DELETE_BLOCKED_BY_BUSINESS_RELATION`
- `ACCOUNT_DELETE_FAILED`

### 9.1 `ACCOUNT_NOT_FOUND`

- target account missing
- or target not visible in current scope

### 9.2 `ACCOUNT_DELETE_CURRENT_FORBIDDEN`

- operator tries to delete the current logged-in account

### 9.3 `ACCOUNT_DELETE_FORBIDDEN`

- operator lacks permission
- or scope does not allow the target

### 9.4 `ACCOUNT_DELETE_BLOCKED_BY_BUSINESS_RELATION`

- one or more business blockers exist
- response should include `blockingReasons[]`

### 9.5 `ACCOUNT_DELETE_FAILED`

- unexpected infrastructure or orchestration failure

## 10. Audit Semantics

This action must have dedicated lifecycle events rather than being folded into status-change events.

Recommended events:

- `ACCOUNT_DELETE_REJECTED`
- `ACCOUNT_DELETED`

### 10.1 Rejected Delete

Emitted when:

- current-account protection triggers
- permission/scope rejection triggers
- business blocker rejection triggers

Recommended details:

- `accountId`
- `userId`
- `tenantId`
- `reasonCode`
- `blockingReasons[]` when present

### 10.2 Successful Delete

Recommended details:

- `accountId`
- `userId`
- `tenantId`
- `deletedSessionCount`
- `clearedRoleCount`
- `deletedOrgMembershipCount`
- `deletedContactAssetCount`
- `userRetained`

## 11. UI Design

### 11.1 Account Directory

Add one row action:

- `删除账号`

Render rules:

- do not show for current logged-in account
- show only when operator has delete permission in visible scope

### 11.2 Confirmation Flow

When user clicks delete:

1. request deletion impact
2. if blocked, show blocker modal
3. if deletable, show destructive confirmation modal

Recommended confirmation content:

- this action will permanently delete the selected account
- active sessions will be removed
- role bindings will be cleared
- account org memberships and work contact assets will be deleted
- the backing user will be retained
- the action cannot be undone

### 11.3 Blocker Modal

If deletion is blocked:

- show `cannot delete`
- show `blockingReasons[]`
- do not offer force-delete action

### 11.4 Success Behavior

On success:

- close modal/drawer
- refresh account directory
- show one concise success summary using returned cleanup counts

## 12. Permission Model

Current permission taxonomy does not yet expose a dedicated account-delete permission.

This slice should add one explicit permission code instead of overloading status-update or profile-update permissions.

Recommended new permission:

- `identity.account.delete`

Usage:

- BFF endpoint guard for delete and delete-precheck
- downstream operator permission enforcement

## 13. Testing Strategy

### 13.1 identity-service

Add tests for:

- current scope resource checks reused for account deletion
- deletion impact query
- delete command
- cascade-count reporting
- user retention

### 13.2 auth-service

Add tests for:

- deleting sessions for one account only
- not affecting other accounts of the same user

### 13.3 permission-service

Add tests for:

- clearing all roles for one account via `setAccountRoles([])`
- not affecting other accounts

### 13.4 auth-bff

Add tests for:

- current-account delete rejection
- blocked delete flow
- successful orchestrated delete flow
- response count mapping

### 13.5 tenant-web

Add tests for:

- current-account row hides delete action
- delete-impact modal rendering
- blocker modal rendering
- destructive confirmation flow
- successful delete refresh behavior

## 14. Risks

### 14.1 Business Blocker Coverage

Risk:

- phase 1 may not yet have all business services integrated into deletion precheck

Mitigation:

- freeze blocker contract now
- treat business coverage expansion as additive integration work

### 14.2 Partial Cleanup Failure

Risk:

- auth or permission cleanup may fail before final delete

Mitigation:

- final identity delete runs last
- failed cleanup keeps account intact and retryable
- emit failure audit and return stable error

### 14.3 Permission Ambiguity

Risk:

- overloading old permissions would make delete governance unclear

Mitigation:

- add dedicated `identity.account.delete`

## 15. Implementation Recommendation

Implement in this order:

1. freeze contracts and permission code
2. add identity-service precheck + delete commands
3. wire auth-service and permission-service cleanup orchestration in BFF
4. add account-management UI delete flow
5. backfill tests and audit assertions

This yields a formal, boundary-clean account deletion capability without collapsing `user` truth into account lifecycle.
