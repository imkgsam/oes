/** AnnotationPermissionPort evaluates P1 create/manage permissions through the platform permission model. */
export interface AnnotationPermissionPort {
  canCreateAnnotation(input: { tenantId: string; operatorAccountId: string }): Promise<boolean>
  canManageAnnotation(input: { tenantId: string; operatorAccountId: string }): Promise<boolean>
}

export const ANNOTATION_PERMISSION_PORT = Symbol('ANNOTATION_PERMISSION_PORT')
