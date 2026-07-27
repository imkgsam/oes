import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentDirectory = new URL('./', import.meta.url)
const commerceComposableUrl = new URL('../composables/useGuestCommerce.ts', import.meta.url)
const accountComposableUrl = new URL('../composables/useAccountDialog.ts', import.meta.url)
const layoutUrl = new URL('../layouts/default.vue', import.meta.url)
const headerUrl = new URL('./home/HomeReplicaHeader.vue', import.meta.url)
const footerUrl = new URL('./home/HomeReplicaFooter.vue', import.meta.url)
const stylesUrl = new URL('../assets/css/dxv-home.css', import.meta.url)
const collectionPageUrl = new URL('../pages/collections/[collection].vue', import.meta.url)
const inspirationDrawerUrl = new URL('./InspirationProductDrawer.vue', import.meta.url)
const productDetailUrl = new URL('./product/KohlerProductDetailReplica.vue', import.meta.url)
const guestDrawerUrl = new URL('./GuestCommerceDrawer.vue', import.meta.url)

// This regression check keeps guest commerce independent from account access across every visible product entry point.
test('Favorites and Cart remain guest actions while My Account owns the account dialog', async () => {
  const [commerceComposable, accountComposable, modal, layout, header, footer, styles, collectionPage, inspirationDrawer, productDetail, guestDrawer] = await Promise.all([
    readFile(commerceComposableUrl, 'utf8'),
    readFile(accountComposableUrl, 'utf8'),
    readFile(new URL('./WishlistSignInModal.vue', componentDirectory), 'utf8'),
    readFile(layoutUrl, 'utf8'),
    readFile(headerUrl, 'utf8'),
    readFile(footerUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
    readFile(collectionPageUrl, 'utf8'),
    readFile(inspirationDrawerUrl, 'utf8'),
    readFile(productDetailUrl, 'utf8'),
    readFile(guestDrawerUrl, 'utf8'),
  ])

  assert.match(commerceComposable, /useState<GuestCommerceState>\('dxv-guest-commerce-state'/)
  assert.match(commerceComposable, /function toggleFavorite\(product: CommerceProductSnapshot\)/)
  assert.match(commerceComposable, /function addToCart\(product: CommerceProductSnapshot, quantity = 1\)/)
  assert.match(accountComposable, /useState<boolean>\('dxv-account-dialog-open'/)
  assert.match(accountComposable, /function openAccountDialog\(\)/)
  assert.match(modal, /role="dialog"/)
  assert.match(modal, /Sign In/)
  assert.match(modal, /Create Account/)
  assert.doesNotMatch(modal, /function selectWishlistAuthTab/)
  assert.doesNotMatch(modal, /<Transition name="dxv-wishlist-auth__panel">/)
  assert.match(modal, /class="dxv-wishlist-auth__tab-slider"/)
  assert.match(modal, /transition: width 300ms;/)
  assert.match(modal, /name="first-name" autocomplete="given-name"/)
  assert.match(modal, /name="last-name" autocomplete="family-name"/)
  assert.match(modal, /name="confirm-password" autocomplete="new-password"/)
  assert.match(modal, /name="accept-terms" required/)
  assert.match(modal, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(modal, /class="dxv-wishlist-auth__field"/)
  assert.match(modal, /input:focus-visible \+ span/)
  assert.match(modal, /transform: translate3d\(0, -50%, 0\) scale\(1\.5\)/)
  assert.match(modal, /const \{ isAccountDialogOpen, closeAccountDialog \} = useAccountDialog\(\)/)
  assert.match(modal, /@click\.self="closeAccountDialog"/)
  assert.match(layout, /<WishlistSignInModal\s*\/>/)
  assert.match(layout, /<GuestCommerceDrawer\s*\/>/)
  assert.match(header, /const \{ openGuestCommerceDrawer \} = useGuestCommerce\(\)/)
  assert.match(header, /class="dxv-action-link dxv-icon-action dxv-favorites-button" type="button" aria-label="Favorites" @click="openGuestCommerceDrawer\('favorites'\)"/)
  assert.match(header, /class="dxv-action-link dxv-icon-action" type="button" aria-label="Open search modal" @click="openSearch"/)
  assert.doesNotMatch(header, /<span>Search<\/span>|<span>Wishlist<\/span>|openWishlistSignIn/)
  assert.match(header, /class="dxv-cart-button" type="button" aria-label="Cart" @click="openGuestCommerceDrawer\('cart'\)"/)
  assert.doesNotMatch(header, /dxv-buy-link|Where [Tt]o Buy|dxv-bookmark-button/)
  assert.match(header, /class="dxv-mobile-favorites-button" type="button" aria-label="Favorites" @click="openGuestCommerceDrawer\('favorites'\)"/)
  assert.match(header, /handleAccountLink\(link, \$event\)/)
  assert.match(footer, /const \{ openAccountDialog \} = useAccountDialog\(\)/)
  assert.match(footer, /handleSupportLink\(link, \$event\)/)
  assert.match(footer, /\{ label: 'Where to Buy', href: '#' \}/)
  assert.match(styles, /\.dxv-cart-button\s*\{[^}]*position:\s*relative[^}]*width:\s*32px[^}]*height:\s*32px/)
  assert.match(styles, /\.dxv-favorites-button span,\s*\.dxv-cart-button span,\s*\.dxv-mobile-favorites-button span,\s*\.dxv-mobile-cart-button span\s*\{[^}]*border-radius:\s*999px/)
  assert.match(styles, /\.dxv-action-link\.dxv-icon-action\s*\{[^}]*width:\s*32px[^}]*justify-content:\s*center/)
  assert.match(styles, /\.dxv-action-link\.dxv-icon-action svg\s*\{[^}]*transform:\s*none/)
  assert.match(collectionPage, /@click="toggleFavorite\(toCommerceProduct\(product\)\)"/)
  assert.match(inspirationDrawer, /@click\.stop="toggleFavorite\(toCommerceProduct\(product\)\)"/)
  assert.match(productDetail, /@click="addCurrentProductToCart"/)
  assert.match(productDetail, /@click="toggleFavorite\(currentCommerceProduct\(\)\)"/)
  assert.match(guestDrawer, /role="dialog"/)
  assert.match(guestDrawer, /@keydown\.esc="closeGuestCommerceDrawer"/)
  assert.doesNotMatch(guestDrawer, /Checkout/)
})
