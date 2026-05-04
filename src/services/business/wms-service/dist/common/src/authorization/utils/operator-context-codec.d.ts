import { OperatorContextPayload, UnsignedOperatorContextPayload } from '../types';
export declare function encodeOperatorContext(payload: OperatorContextPayload): string;
export declare function decodeOperatorContext(rawPayload: string): OperatorContextPayload;
export declare function getUnsignedOperatorContextPayload(payload: OperatorContextPayload | UnsignedOperatorContextPayload): UnsignedOperatorContextPayload;
export declare function canonicalizeOperatorContextForSigning(payload: OperatorContextPayload | UnsignedOperatorContextPayload): string;
export declare function validateOperatorContextPayload(payload: OperatorContextPayload): string | undefined;
