export type GuestCommerceDrawerKind = 'favorites' | 'cart'

export type CommerceProductSnapshot = {
  productKey: string
  title: string
  href: string
  image: string
  price: string
  variantKey?: string
  variantLabel?: string
}

export type GuestCartLine = CommerceProductSnapshot & {
  cartLineKey: string
  quantity: number
}

type GuestCommerceState = {
  favorites: CommerceProductSnapshot[]
  cartLines: GuestCartLine[]
}

const guestCommerceStorageKey = 'dxv-guest-commerce-v1'
const maximumCartQuantity = 99

// Creates a fresh state value so guest commerce never shares mutable defaults between app instances.
function createEmptyGuestCommerceState(): GuestCommerceState {
  return { favorites: [], cartLines: [] }
}

// Derives the canonical product identity from a storefront route when callers do not have an explicit slug.
function productKeyFromHref(href: string): string {
  const segments = href.split('?')[0]?.split('/').filter(Boolean) ?? []
  return segments.at(-1)?.trim() ?? ''
}

// Validates and normalizes a UI product snapshot before it can enter visitor-controlled browser storage.
function normalizeProductSnapshot(snapshot: CommerceProductSnapshot): CommerceProductSnapshot | null {
  const productKey = (snapshot.productKey || productKeyFromHref(snapshot.href)).trim()
  const title = snapshot.title.trim()
  const href = snapshot.href.trim()
  const image = snapshot.image.trim()
  const price = snapshot.price.trim()

  if (!productKey || !title || !href || !image || !price) {
    return null
  }

  return {
    productKey,
    title,
    href,
    image,
    price,
    variantKey: snapshot.variantKey?.trim() || undefined,
    variantLabel: snapshot.variantLabel?.trim() || undefined,
  }
}

// Reconstructs only well-formed saved state and silently falls back for stale browser values.
function parseStoredGuestCommerceState(value: string | null): GuestCommerceState {
  if (!value) {
    return createEmptyGuestCommerceState()
  }

  try {
    const parsed = JSON.parse(value) as Partial<GuestCommerceState>
    const favorites = Array.isArray(parsed.favorites)
      ? parsed.favorites
        .map((item) => normalizeProductSnapshot(item as CommerceProductSnapshot))
        .filter((item): item is CommerceProductSnapshot => Boolean(item))
      : []
    const cartLines = Array.isArray(parsed.cartLines)
      ? parsed.cartLines
        .map((item) => {
          const snapshot = normalizeProductSnapshot(item as CommerceProductSnapshot)
          const quantity = Number((item as GuestCartLine).quantity)
          if (!snapshot || !Number.isFinite(quantity) || quantity < 1) {
            return null
          }

          const variantKey = snapshot.variantKey ?? snapshot.productKey
          return {
            ...snapshot,
            cartLineKey: `${snapshot.productKey}::${variantKey}`,
            quantity: Math.min(Math.floor(quantity), maximumCartQuantity),
          }
        })
        .filter((item): item is GuestCartLine => Boolean(item))
      : []

    return {
      favorites: Array.from(new Map(favorites.map((item) => [item.productKey, item])).values()),
      cartLines: Array.from(new Map(cartLines.map((item) => [item.cartLineKey, item])).values()),
    }
  } catch {
    return createEmptyGuestCommerceState()
  }
}

// Converts the current display price into a non-authoritative number used only for the guest drawer subtotal.
function priceToNumber(price: string): number {
  const value = Number.parseFloat(price.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(value) ? value : 0
}

// Owns guest Favorites and Cart state without treating browser storage as a source of commerce truth.
export const useGuestCommerce = () => {
  const state = useState<GuestCommerceState>('dxv-guest-commerce-state', createEmptyGuestCommerceState)
  const activeGuestCommerceDrawer = useState<GuestCommerceDrawerKind | null>('dxv-guest-commerce-drawer', () => null)
  const hasHydratedGuestCommerce = useState<boolean>('dxv-guest-commerce-hydrated', () => false)

  // Writes the latest valid snapshot when browser storage is available and deliberately ignores storage failures.
  function persistGuestCommerceState() {
    if (import.meta.server) {
      return
    }

    try {
      window.localStorage.setItem(guestCommerceStorageKey, JSON.stringify(state.value))
    } catch {
      // Private browsing or quota failures leave the current in-memory shopping session usable.
    }
  }

  // Hydrates the client-only guest cache once while preserving stable SSR output.
  function hydrateGuestCommerceState() {
    if (import.meta.server || hasHydratedGuestCommerce.value) {
      return
    }

    try {
      state.value = parseStoredGuestCommerceState(window.localStorage.getItem(guestCommerceStorageKey))
    } catch {
      state.value = createEmptyGuestCommerceState()
    }

    hasHydratedGuestCommerce.value = true
  }

  // Waits for the complete component tree to finish hydration before browser state updates visible product controls.
  onMounted(() => nextTick(hydrateGuestCommerceState))

  const favoriteCount = computed(() => state.value.favorites.length)
  const cartItemCount = computed(() => state.value.cartLines.reduce((count, line) => count + line.quantity, 0))
  const cartSubtotal = computed(() => state.value.cartLines.reduce((subtotal, line) => subtotal + priceToNumber(line.price) * line.quantity, 0))

  // Opens one of the two global guest-commerce drawers without invoking account state.
  function openGuestCommerceDrawer(kind: GuestCommerceDrawerKind) {
    activeGuestCommerceDrawer.value = kind
  }

  // Closes the currently active guest-commerce drawer.
  function closeGuestCommerceDrawer() {
    activeGuestCommerceDrawer.value = null
  }

  // Reports whether the product is already saved by product identity rather than by a rendered card instance.
  function isFavorite(productKey: string) {
    return state.value.favorites.some((favorite) => favorite.productKey === productKey)
  }

  // Adds or removes a product from Favorites and persists the resulting guest state.
  function toggleFavorite(product: CommerceProductSnapshot) {
    const normalizedProduct = normalizeProductSnapshot(product)
    if (!normalizedProduct) {
      return
    }

    const existingIndex = state.value.favorites.findIndex((favorite) => favorite.productKey === normalizedProduct.productKey)
    state.value = existingIndex >= 0
      ? {
          ...state.value,
          favorites: state.value.favorites.filter((favorite) => favorite.productKey !== normalizedProduct.productKey),
        }
      : {
          ...state.value,
          favorites: [...state.value.favorites, normalizedProduct],
        }
    persistGuestCommerceState()
  }

  // Adds a selected product variant to Cart and combines repeat additions into one line.
  function addToCart(product: CommerceProductSnapshot, quantity = 1) {
    const normalizedProduct = normalizeProductSnapshot(product)
    if (!normalizedProduct) {
      return
    }

    const cartLineKey = `${normalizedProduct.productKey}::${normalizedProduct.variantKey ?? normalizedProduct.productKey}`
    const requestedQuantity = Math.max(1, Math.floor(quantity))
    const existingLine = state.value.cartLines.find((line) => line.cartLineKey === cartLineKey)
    const nextLine: GuestCartLine = {
      ...normalizedProduct,
      cartLineKey,
      quantity: Math.min((existingLine?.quantity ?? 0) + requestedQuantity, maximumCartQuantity),
    }

    state.value = {
      ...state.value,
      cartLines: existingLine
        ? state.value.cartLines.map((line) => line.cartLineKey === cartLineKey ? nextLine : line)
        : [...state.value.cartLines, nextLine],
    }
    persistGuestCommerceState()
  }

  // Changes one cart line quantity and removes the line when the requested quantity is zero.
  function setCartLineQuantity(cartLineKey: string, quantity: number) {
    const normalizedQuantity = Math.floor(quantity)
    state.value = {
      ...state.value,
      cartLines: normalizedQuantity < 1
        ? state.value.cartLines.filter((line) => line.cartLineKey !== cartLineKey)
        : state.value.cartLines.map((line) => line.cartLineKey === cartLineKey
          ? { ...line, quantity: Math.min(normalizedQuantity, maximumCartQuantity) }
          : line),
    }
    persistGuestCommerceState()
  }

  // Removes an individual cart line without changing the visitor's remaining guest state.
  function removeCartLine(cartLineKey: string) {
    state.value = {
      ...state.value,
      cartLines: state.value.cartLines.filter((line) => line.cartLineKey !== cartLineKey),
    }
    persistGuestCommerceState()
  }

  return {
    activeGuestCommerceDrawer,
    favorites: computed(() => state.value.favorites),
    cartLines: computed(() => state.value.cartLines),
    favoriteCount,
    cartItemCount,
    cartSubtotal,
    openGuestCommerceDrawer,
    closeGuestCommerceDrawer,
    isFavorite,
    toggleFavorite,
    addToCart,
    setCartLineQuantity,
    removeCartLine,
  }
}
