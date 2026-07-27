// Keeps general account-dialog visibility independent from visitor Favorites and Cart interactions.
export const useAccountDialog = () => {
  const isAccountDialogOpen = useState<boolean>('dxv-account-dialog-open', () => false)

  // Opens the shared sign-in and registration dialog from an approved account entry point.
  function openAccountDialog() {
    isAccountDialogOpen.value = true
  }

  // Closes the shared account dialog without changing guest-commerce state.
  function closeAccountDialog() {
    isAccountDialogOpen.value = false
  }

  return {
    isAccountDialogOpen,
    openAccountDialog,
    closeAccountDialog,
  }
}
