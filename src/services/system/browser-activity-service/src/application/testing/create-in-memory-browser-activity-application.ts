import { BrowserActivityApplication } from '../browser-activity-application'

// createInMemoryBrowserActivityApplication builds the P1 application with in-memory repositories for Unit tests.
export function createInMemoryBrowserActivityApplication() {
  return new BrowserActivityApplication()
}
