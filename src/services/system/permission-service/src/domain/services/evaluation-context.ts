/** Context passed to the policy engine for condition evaluation */
export interface EvaluationContext {
  subject: Record<string, any>
  resource: Record<string, any>
  environment: Record<string, any>
  action: Record<string, any>
}
