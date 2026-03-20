import { ExceptionFactory } from '@oes/common/exceptions'
import { POLICY_CONDITION_INVALID } from '../../../common/constants/exception-enums'
import {
  parsePolicyConditionAstJson,
  PolicyConditionAstValidationError
} from '../../../domain/services/policy-condition-ast'

export function normalizePolicyConditionAstJson(raw?: string): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  try {
    parsePolicyConditionAstJson(trimmed)
    return trimmed
  } catch (error) {
    if (error instanceof PolicyConditionAstValidationError) {
      throw ExceptionFactory.domain(POLICY_CONDITION_INVALID, error.details)
    }

    throw ExceptionFactory.domain(POLICY_CONDITION_INVALID, {
      reason: 'invalid_condition_ast_json'
    })
  }
}
