import { ExceptionConst } from '@oes/common/exceptions'

/**
 * 璁よ瘉鏈嶅姟閿欒鐮佸畾涔? *
 * 閿欒鐮佸垎绫伙細
 * - 0001-0099: 閫氱敤璁よ瘉閿欒
 * - 0100-0199: 鐧诲綍璁よ瘉閿欒
 * - 0200-0299: MFA 鐩稿叧閿欒
 * - 0300-0399: Session 鐩稿叧閿欒
 * - 0400-0499: 璁惧鐩稿叧閿欒
 */

// ==================== Code-based Errors (RawError) ====================
// 杩欎簺閿欒鐢ㄤ簬鍐呴儴涓氬姟閫昏緫锛屼笉鐩存帴杩斿洖缁欏鎴风

export const AUTH_SERVICE_CODE_ERRORS: Record<string, ExceptionConst> = {
  // ==================== 閫氱敤璁よ瘉閿欒 (0001-0099) ====================

  /**
   * OTP 楠岃瘉鐮佸凡杩囨湡
   *
   * 浣跨敤鍦烘櫙锛?   * - 閭楠岃瘉鐮佽秴杩囨湁鏁堟湡
   * - 鐭俊楠岃瘉鐮佽秴杩囨湁鏁堟湡
   * - TOTP 鏃堕棿绐楀彛宸茶繃鏈?   * - 鐢ㄦ埛杈撳叆楠岃瘉鐮佹椂宸茶秴鏃?   */
  OTP_EXPIRED: {
    subCode: '0002',
    message: '楠岃瘉鐮佸凡杩囨湡',
    messageKey: 'auth.otp_expired'
  },

  /**
   * OTP 楠岃瘉灏濊瘯娆℃暟宸茶揪涓婇檺
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛杩炵画杈撳叆閿欒楠岃瘉鐮佽秴杩囬檺鍒?   * - 闃叉鏆村姏鐮磋В楠岃瘉鐮?   * - 闇€瑕佺敤鎴烽噸鏂拌幏鍙栭獙璇佺爜
   */
  OTP_REACH_LIMIT: {
    subCode: '0003',
    message: '楠岃瘉鐮佸皾璇曟鏁板凡杈句笂闄?,
    messageKey: 'auth.otp_reach_limit'
  },

  /**
   * OTP 楠岃瘉鐮佹棤鏁?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛杈撳叆閿欒鐨勯獙璇佺爜
   * - 楠岃瘉鐮佹牸寮忎笉姝ｇ‘
   * - 楠岃瘉鐮佸凡琚娇鐢?   * - 楠岃瘉鐮佷笌鐢ㄦ埛涓嶅尮閰?   */
  OTP_INVALID: {
    subCode: '0004',
    message: '楠岃瘉鐮佹棤鏁?,
    messageKey: 'auth.otp_invalid'
  },

  // ==================== MFA 鐩稿叧閿欒 (0200-0299) ====================

  /**
   * MFA 绫诲瀷涓嶅尮閰?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛灏濊瘯浣跨敤閿欒鐨?MFA 绫诲瀷杩涜楠岃瘉
   * - 鍓嶇浼犻€掔殑 MFA 绫诲瀷涓庡悗绔湡鏈涗笉绗?   * - 鐢ㄦ埛缁戝畾绫诲瀷涓庨獙璇佺被鍨嬩笉涓€鑷?   */
  MFA_TYPE_MISMATCH: {
    subCode: '0200',
    message: 'MFA 绫诲瀷涓嶅尮閰?,
    messageKey: 'auth.mfa_type_mismatch'
  },

  /**
   * MFA 缁戝畾宸茬鐢?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛绂佺敤浜嗘煇绉?MFA 鏂瑰紡
   * - 绠＄悊鍛樼鐢ㄤ簡鐢ㄦ埛鐨?MFA 缁戝畾
   * - 绯荤粺缁存姢鏃朵复鏃剁鐢?MFA
   */
  MFA_DISABLED: {
    subCode: '0201',
    message: 'MFA 缁戝畾宸茬鐢?,
    messageKey: 'auth.mfa_disabled'
  },

  /**
   * MFA 绫诲瀷涓嶆敮鎸?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛灏濊瘯缁戝畾涓嶆敮鎸佺殑 MFA 绫诲瀷
   * - 绯荤粺涓嶆敮鎸佹煇绉?MFA 鏂瑰紡
   * - 閰嶇疆閿欒瀵艰嚧绫诲瀷涓嶆敮鎸?   */
  MFA_TYPE_NOT_SUPPORTED: {
    subCode: '0202',
    message: 'MFA 绫诲瀷涓嶆敮鎸?,
    messageKey: 'auth.mfa_type_not_supported'
  },

  /**
   * MFA 楠岃瘉闇€瑕?OTP 浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 楠岃瘉閭鎴栫煭淇?MFA 鏃剁己灏?OTP 浠ょ墝
   * - 鍓嶇鏈纭紶閫?OTP 浠ょ墝
   * - 浠ょ墝宸茶繃鏈熸垨鏃犳晥
   */
  MFA_OTP_TOKEN_REQUIRED: {
    subCode: '0203',
    message: 'MFA 楠岃瘉闇€瑕?OTP 浠ょ墝',
    messageKey: 'auth.mfa_otp_token_required'
  },

  /**
   * MFA 缁戝畾涓嶅瓨鍦?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛灏濊瘯楠岃瘉鏈粦瀹氱殑 MFA 鏂瑰紡
   * - 缁戝畾 ID 涓嶅瓨鍦ㄦ垨宸插垹闄?   * - 鐢ㄦ埛鏈缃?MFA
   * - 缁戝畾鏁版嵁鎹熷潖鎴栦涪澶?   */
  MFA_BINDING_NOT_FOUND: {
    subCode: '0204',
    message: 'MFA 缁戝畾涓嶅瓨鍦?,
    messageKey: 'auth.mfa_binding_not_found'
  },

  /**
   * MFA 缁戝畾宸插瓨鍦?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛灏濊瘯閲嶅缁戝畾鍚岀被鍨嬬殑 MFA
   * - 鐢ㄦ埛宸茬粦瀹氳绫诲瀷鐨?MFA
   * - 闃叉閲嶅缁戝畾鍚屼竴璁惧鎴栬处鍙?   */
  MFA_BINDING_ALREADY_EXISTS: {
    subCode: '0206',
    message: 'MFA 缁戝畾宸插瓨鍦?,
    messageKey: 'auth.mfa_binding_already_exists'
  }
}

// ==================== Exception-based Errors (RawError) ====================
// 杩欎簺閿欒浼氱洿鎺ヨ繑鍥炵粰瀹㈡埛绔紝鍖呭惈 HTTP 鐘舵€佺爜

export const AUTH_SERVICE_EXCEPTION_ERRORS: Record<string, ExceptionConst> = {
  // ==================== 鐧诲綍璁よ瘉閿欒 (0100-0199) ====================

  /**
   * 璁よ瘉澶辫触
   *
   * 浣跨敤鍦烘櫙锛?   * - 閫氱敤璁よ瘉澶辫触
   * - 璁よ瘉杩囩▼涓彂鐢熸湭鐭ラ敊璇?   * - 绯荤粺鏃犳硶瀹屾垚璁よ瘉娴佺▼
   */
  AUTHENTICATION_FAILED: {
    subCode: '0100',
    message: '璁よ瘉澶辫触',
    messageKey: 'auth.authentication_failed',
    httpStatus: 401
  },

  /**
   * 鏃犳晥鍑瘉
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒
   * - 閭鎴栧瘑鐮佷笉鍖归厤
   * - 鎵嬫満鍙锋垨瀵嗙爜涓嶅尮閰?   */
  INVALID_CREDENTIALS: {
    subCode: '0101',
    message: '鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒',
    messageKey: 'auth.invalid_credentials',
    httpStatus: 401
  },

  /**
   * 璐︽埛琚鐢?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛璐︽埛琚鐞嗗憳绂佺敤
   * - 鐢ㄦ埛璐︽埛鍥犺繚瑙勮灏佺
   * - 璐︽埛鐘舵€佸紓甯?   */
  ACCOUNT_DISABLED: {
    subCode: '0102',
    message: '璐︽埛宸茶绂佺敤',
    messageKey: 'auth.account_disabled',
    httpStatus: 403
  },

  /**
   * 鐧诲綍鏂规硶鏈獙璇?   *
   * 浣跨敤鍦烘櫙锛?   * - 閭鐧诲綍鏂规硶鏈獙璇?   * - 鎵嬫満鍙风櫥褰曟柟娉曟湭楠岃瘉
   * - 闇€瑕佸厛楠岃瘉鐧诲綍鏂规硶鎵嶈兘浣跨敤
   */
  LOGIN_METHOD_NOT_VERIFIED: {
    subCode: '0103',
    message: '鐧诲綍鏂规硶鏈獙璇?,
    messageKey: 'auth.login_method_not_verified',
    httpStatus: 403
  },

  /**
   * 瀵嗙爜鍑瘉鏈壘鍒?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛娌℃湁璁剧疆瀵嗙爜
   * - 瀵嗙爜鍑瘉琚垹闄?   * - 瀵嗙爜鍑瘉閰嶇疆閿欒
   */
  PASSWORD_CREDENTIAL_NOT_FOUND: {
    subCode: '0106',
    message: '瀵嗙爜鍑瘉鏈壘鍒?,
    messageKey: 'auth.password_credential_not_found',
    httpStatus: 404
  },

  /**
   * 瀵嗙爜鍑瘉琚鐢?   *
   * 浣跨敤鍦烘櫙锛?   * - 瀵嗙爜鐧诲綍琚鐢?   * - 绠＄悊鍛樼鐢ㄤ簡瀵嗙爜鐧诲綍
   * - 瀵嗙爜鍑瘉鐘舵€佸紓甯?   */
  PASSWORD_CREDENTIAL_DISABLED: {
    subCode: '0107',
    message: '瀵嗙爜鐧诲綍琚鐢?,
    messageKey: 'auth.password_credential_disabled',
    httpStatus: 403
  },

  /**
   * OAuth 鍑瘉鏈壘鍒?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛娌℃湁 OAuth 鍑瘉
   * - OAuth 鍑瘉琚垹闄?   * - OAuth 閰嶇疆缂哄け
   */
  OAUTH_CREDENTIAL_NOT_FOUND: {
    subCode: '0108',
    message: 'OAuth 鍑瘉鏈壘鍒?,
    messageKey: 'auth.oauth_credential_not_found',
    httpStatus: 404
  },

  /**
   * OAuth 鍑瘉琚鐢?   *
   * 浣跨敤鍦烘櫙锛?   * - OAuth 鐧诲綍琚鐢?   * - 绠＄悊鍛樼鐢ㄤ簡 OAuth 鐧诲綍
   * - OAuth 鍑瘉鐘舵€佸紓甯?   */
  OAUTH_CREDENTIAL_DISABLED: {
    subCode: '0109',
    message: 'OAuth 鐧诲綍琚鐢?,
    messageKey: 'auth.oauth_credential_disabled',
    httpStatus: 403
  }
}

// ==================== 鍏煎鎬у鍑?====================
// 涓轰簡淇濇寔鍚戝悗鍏煎锛屽悎骞舵墍鏈夐敊璇埌涓€涓璞′腑

export const AUTH_SERVICE_ERRORS: Record<string, ExceptionConst> = {
  ...AUTH_SERVICE_CODE_ERRORS,
  ...AUTH_SERVICE_EXCEPTION_ERRORS
}
