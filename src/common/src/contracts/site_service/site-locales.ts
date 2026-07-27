export interface SiteSupportedLocaleOption {
  locale: SiteSupportedLocale
  nativeName: string
}

export type SiteSupportedLocale =
  | 'en-US'
  | 'zh-CN'
  | 'fr-FR'
  | 'de-DE'
  | 'es-ES'
  | 'ja-JP'
  | 'ko-KR'

/** SITE_SUPPORTED_LOCALE_OPTIONS is the fixed system locale enum shared by Site Management services. */
export const SITE_SUPPORTED_LOCALE_OPTIONS: readonly SiteSupportedLocaleOption[] = [
  { locale: 'en-US', nativeName: 'English (United States)' },
  { locale: 'zh-CN', nativeName: '简体中文' },
  { locale: 'fr-FR', nativeName: 'Français' },
  { locale: 'de-DE', nativeName: 'Deutsch' },
  { locale: 'es-ES', nativeName: 'Español' },
  { locale: 'ja-JP', nativeName: '日本語' },
  { locale: 'ko-KR', nativeName: '한국어' }
] as const

const SUPPORTED_SITE_LOCALE_SET = new Set<string>(SITE_SUPPORTED_LOCALE_OPTIONS.map((option) => option.locale))

/** isSupportedSiteLocale checks whether a locale can be selected for a managed site. */
export function isSupportedSiteLocale(locale: string): locale is SiteSupportedLocale {
  return SUPPORTED_SITE_LOCALE_SET.has(locale.trim())
}
