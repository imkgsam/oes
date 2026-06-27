// runBackgroundTask attaches an error sink to background fire-and-forget work.
export function runBackgroundTask(
  task: Promise<unknown>,
  options: { onError?: (error: unknown) => void } = {}
): void {
  void task.catch((error) => {
    options.onError?.(error)
  })
}
