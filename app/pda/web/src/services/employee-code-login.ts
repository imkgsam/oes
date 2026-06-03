export {
  normalizeEmployeeCodeInput,
  parseEmployeeCodeScanInput,
} from './employee-code-format';

/** Returns true only for the six digit terminal PIN shape accepted by the PDA login contract. */
export function isCompleteTerminalPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
