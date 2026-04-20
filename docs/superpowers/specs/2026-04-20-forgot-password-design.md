# Forgot Password Design

## 1. Goal

Freeze the first executable self-service forgot-password design for `tenant-web` so the login entry can move from a controlled placeholder into a real but development-safe recovery flow.

This slice is for `用户自助找回密码`, not `管理员要求用户下次登录重设密码`.

## 2. Scope

### In Scope

- self-service forgot-password entry in `tenant-web`
- email OTP and phone OTP recovery
- `auth-bff` black-box HTTP contracts for recovery challenge creation, OTP verification, and password reset completion
- `auth-service` reset challenge, OTP verification, password update, session revocation, and audit
- `notification-service` mock dispatch for email and SMS OTP delivery
- step-by-step recovery UI
- frontend security gate based on the existing framework captcha component

### Out of Scope

- real third-party email delivery
- real third-party SMS delivery
- real Google reCAPTCHA integration
- username-only password recovery
- admin-triggered reset flow redesign
- passwordless auto-login after reset
- recovery by customer service or manual operator workflow
- risk-engine or server-side challenge platformization

## 3. Product Decisions Frozen In This Design

### 3.1 Recovery Ownership

- OES allows `用户自助找回密码`.
- This feature is separate from administrator reset semantics.
- The source of truth for password recovery remains in `auth-service`.

### 3.2 Allowed Recovery Identifiers

- Users may recover only through a verified login email or a verified login phone.
- Unverified email or phone must not be accepted as a valid recovery destination.
- Username, account name, and profile-only contact data must not be used as recovery truth.

### 3.3 Channel Choice

- The page provides two entry modes:
  - `邮箱找回`
  - `手机号找回`
- The user chooses the mode by deciding which identifier to submit.
- The system must not reveal all available verified channels before identity proof.
- If the submitted identifier is valid for recovery, the system sends an OTP for that channel.
- If the identifier is not valid for recovery, the API still returns a generic accepted response to avoid account enumeration.

### 3.4 OTP Policy

- Email and phone both use OTP.
- Current V1 development mode fixes the OTP value to `123456`.
- The fixed OTP applies only to forgot-password mock mode.
- OTP truth must be created and verified by `auth-service`, not by `notification-service`.

### 3.5 Notification Delivery

- `notification-service` is used in the flow.
- Current V1 does not perform real email or SMS delivery.
- `notification-service` records dispatch intent and behaves as a mock delivery provider.
- Mock delivery must not become the long-term production default.

### 3.6 Session Handling After Reset

- After password reset succeeds, all existing sessions for the target user must be revoked immediately.
- The user is redirected back to login after reset completion.
- The reset flow does not auto-create a fresh authenticated session.

### 3.7 Frontend Security Gate

- Current V1 does not integrate real Google reCAPTCHA.
- Current V1 reuses the existing frontend captcha component already present in the framework, such as the current `SliderCaptcha` pattern.
- The captcha is treated as a frontend security gate for this phase, not as a fully platformized risk-control capability.

### 3.8 UI Form

- The forgot-password page must use a step-by-step recovery flow, not one large combined form.
- The UI must make the user aware of the current step, next step, and completion state.

## 4. Candidate Approaches

### Approach A: Auth-Service-Owned Reset Challenge With Mock Notification Delivery (Recommended)

- `tenant-web` renders a multi-step recovery page
- `auth-bff` exposes thin HTTP APIs
- `auth-service` owns recovery challenge truth, OTP truth, password mutation, and session revocation
- `notification-service` accepts delivery requests but uses mock providers

Why this is recommended:

- it preserves the current auth boundary
- it avoids pushing password recovery truth into frontend or `identity-service`
- it allows mock delivery now and real delivery later without redesigning the core flow

### Approach B: Identity-Service-Led Recovery

- use user profile email or phone as the recovery source

Why this is not recommended:

- login identifier truth belongs to `auth-service`, not `identity-service`
- profile contact data and login contact data are not equivalent
- it would violate the current login-method boundary

### Approach C: Frontend-Only Mock Recovery

- keep recovery logic mostly in `tenant-web`, fake challenge state, and fake verification

Why this is not recommended:

- it breaks auditability
- it bypasses the auth boundary
- it creates a throwaway flow that will need to be rewritten when real delivery arrives

## 5. Recommended Architecture

### 5.1 Responsibility Split

#### tenant-web

Owns:

- step-by-step UI
- input validation and interaction state
- existing frontend captcha component integration
- user-facing success and error messaging

Must not own:

- OTP truth
- reset challenge truth
- password mutation truth

#### auth-bff

Owns:

- HTTP request DTO validation
- stable black-box response shapes
- operator / trace metadata propagation
- generic response semantics for anti-enumeration

Must remain thin:

- no core recovery rules in controller or DTO

#### auth-service

Owns:

- recovery challenge creation
- identifier normalization and verified-login-method lookup
- OTP creation
- OTP verification
- reset token or verified challenge state
- new password validation and write
- all-session revocation
- audit events

#### notification-service

Owns:

- dispatch acceptance
- delivery recording
- mock email and SMS provider behavior in V1

Must not own:

- final OTP truth
- password reset verification truth

### 5.2 Why OTP Truth Must Stay In Auth-Service

- The OTP is part of password-recovery authentication truth.
- `notification-service` may simulate delivery, but it must not become the authority for which OTP is valid.
- If V1 fixes the OTP to `123456`, `auth-service` must be the component that writes and verifies that value for forgot-password mock mode.

## 6. User Flow

### 6.1 Step 1: Choose Channel And Submit Identifier

- The page shows two tabs or segmented choices:
  - `邮箱找回`
  - `手机号找回`
- The user enters one identifier for the selected mode.
- The system validates only format on the client side at this step.

### 6.2 Step 2: Frontend Captcha Gate

- Before a reset challenge is created, the user must pass the existing frontend captcha widget.
- The widget is the same family of component already used in current authentication and security-center flows.
- The result is used only to advance the current V1 page flow.

### 6.3 Step 3: Create Reset Challenge And Mock Delivery

- `tenant-web` calls `auth-bff`.
- `auth-bff` calls `auth-service`.
- `auth-service` resolves whether the submitted identifier is a verified login method.
- If resolvable, `auth-service` creates a forgot-password challenge and OTP.
- `auth-service` asks `notification-service` to send the OTP through mock delivery.
- The HTTP response stays generic whether or not the identifier is eligible.

Recommended success copy:

- `如果该方式可用于找回，我们已发送验证码，请注意查收。`

### 6.4 Step 4: Verify OTP

- The user enters the six-digit OTP.
- In current V1 mock mode, the valid code is `123456`.
- On success, the user may proceed to the password setup step.
- On failure, the user sees a stable error without leaking extra account-state detail.

### 6.5 Step 5: Set New Password

- The user enters the new password and confirmation.
- `auth-service` validates password policy and updates password credentials.
- On success, `auth-service` revokes all active sessions for the user.
- The page moves to a completion state and returns the user to login.

## 7. Contract Proposal

### 7.1 Auth-BFF HTTP

Recommended endpoints:

- `POST /auth/password-recovery/challenges`
- `POST /auth/password-recovery/challenges/:challengeId/verify`
- `POST /auth/password-recovery/complete`

#### `POST /auth/password-recovery/challenges`

Purpose:

- create or accept one forgot-password recovery attempt after the frontend captcha gate

Request shape:

- `channel`: `EMAIL | PHONE`
- `identifier`
- `captchaPassed`: boolean

Stable semantics:

- always returns a generic accepted response
- does not reveal whether the account exists
- does not reveal whether the identifier is verified

Recommended response shape:

- `accepted`
- `challengeId`
- `expiresAt`
- `maskedDestination` optional
- `message`

#### `POST /auth/password-recovery/challenges/:challengeId/verify`

Purpose:

- verify one recovery OTP

Request shape:

- `otp`

Recommended response shape:

- `verified`
- `resetToken`
- `passwordPolicy` optional

#### `POST /auth/password-recovery/complete`

Purpose:

- set the new password and revoke all current sessions

Request shape:

- `resetToken`
- `newPassword`
- `confirmPassword`

Recommended response shape:

- `success`
- `sessionsRevoked`
- `redirectToLogin`

### 7.2 Auth-Service Internal Capabilities

Recommended RPC or command semantics:

- `CreatePasswordRecoveryChallenge`
- `VerifyPasswordRecoveryChallenge`
- `CompletePasswordRecovery`

These capabilities should own:

- verified login-method lookup
- challenge creation
- OTP verification
- password write
- session revocation
- audit emission

### 7.3 Notification-Service Contract Usage

Use existing send-email / send-sms style contract through `auth-service` notification dispatch.

V1 semantics:

- accept the dispatch
- record mock delivery
- do not actually send email or SMS

## 8. Mock Strategy

### 8.1 Mock OTP Policy

- Forgot-password mock mode uses fixed OTP `123456`.
- This value is uniform across email and phone recovery.
- The fixed value must be defined in the forgot-password path of `auth-service`.

### 8.2 Mock Notification Policy

- `notification-service` receives email and SMS dispatch requests normally.
- Local providers only record and log dispatch activity.
- No real outbound provider is called.

### 8.3 Future Upgrade Path

- Later phases may replace mock delivery with real providers without changing the primary recovery flow.
- Later phases may replace the frontend-only captcha gate with a server-verified challenge service without changing the password-recovery contract intent.

## 9. Error Handling And Security Rules

- never expose whether one identifier maps to an existing user
- never expose whether the identifier is verified or unverified
- never return password hash, OTP value, or credential secret
- rate limiting must be applied to challenge creation and OTP verification
- OTP failures must not disclose extra account state
- password reset completion requires a previously verified reset token or equivalent verified challenge state
- completion must invalidate the verified reset token after one use
- session revocation must happen in the same successful recovery completion path

## 10. UI Design Notes

- The page should present a clear visual stepper:
  - `选择方式`
  - `安全验证`
  - `输入验证码`
  - `设置新密码`
  - `完成`
- Each step should explain what is happening and what comes next.
- The page should reuse existing authentication visual language rather than inventing a separate design system.
- The captcha should appear as an explicit flow step, not as hidden incidental UI.

## 11. Testing And Acceptance

### 11.1 Service Acceptance

- challenge creation returns a generic accepted response for both existing and non-existing identifiers
- verified login email can complete the flow
- verified login phone can complete the flow
- unverified identifier cannot actually complete the flow
- OTP `123456` succeeds in mock forgot-password mode
- successful reset revokes all existing sessions

### 11.2 Frontend Acceptance

- the placeholder page is replaced with a real stepper flow
- the user cannot request an OTP before passing the existing captcha gate
- email and phone recovery modes both work
- successful completion returns the user to login
- failure messaging remains stable and does not leak account state

## 12. Risks And Follow-Ups

- The frontend captcha gate is not equivalent to a real server-side security challenge.
- Fixed OTP `123456` is strictly for development and integration environments.
- If mock mode leaks into production configuration, the recovery flow becomes unsafe.
- Real provider integration will still require explicit contract and configuration work later.

## 13. Recommendation

Proceed with this V1 design:

- self-service forgot password
- verified login email / phone only
- OTP recovery for both channels
- mock notification delivery through `notification-service`
- fixed OTP `123456` owned by `auth-service`
- step-by-step `tenant-web` page
- existing frontend captcha component as the current safety gate

This gives OES a real executable recovery flow now without breaking the current service boundaries or pretending that real outbound notification and real external captcha infrastructure already exist.
