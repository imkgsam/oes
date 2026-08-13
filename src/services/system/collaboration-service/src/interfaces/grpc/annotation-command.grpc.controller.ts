import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { AuthorizeBusinessRpc, AuthorizeSelfServiceRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AnnotationCommandServiceController,
  AnnotationCommandServiceControllerMethods,
  CreateAnnotationRequest,
  CreateAnnotationResponse,
  DeleteAnnotationRequest,
  DeleteAnnotationResponse,
  SetAnnotationPinnedRequest,
  SetAnnotationPinnedResponse,
  UpdateAnnotationRequest,
  UpdateAnnotationResponse
} from '@oes/common/generated/collaboration_service'
import { AnnotationCommandService } from '../../application/services/annotation-command.service'
import {
  fromProtoAnnotationVisibility,
  fromProtoObjectRef,
  mapAnnotationError,
  requireAnnotationCommandContext
} from './annotation-grpc.mapping'
import { presentAnnotation } from './annotation-grpc.presenter'

/** AnnotationCommandGrpcController exposes Annotation P1 write commands over internal gRPC. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@AnnotationCommandServiceControllerMethods()
export class AnnotationCommandGrpcController implements AnnotationCommandServiceController {
  constructor(private readonly annotationCommandService: AnnotationCommandService) {}

  async createAnnotation(request: CreateAnnotationRequest): Promise<CreateAnnotationResponse> {
    try {
      const annotation = await this.annotationCommandService.createAnnotation({
        ...requireAnnotationCommandContext(request),
        objectRef: fromProtoObjectRef(request.objectRef),
        bodyText: request.bodyText ?? '',
        visibility: fromProtoAnnotationVisibility(request.visibility)
      })
      return { annotation: presentAnnotation(annotation) }
    } catch (error) {
      mapAnnotationError(error)
    }
  }

  async updateAnnotation(request: UpdateAnnotationRequest): Promise<UpdateAnnotationResponse> {
    try {
      const annotation = await this.annotationCommandService.updateAnnotation({
        ...requireAnnotationCommandContext(request),
        annotationId: request.annotationId ?? '',
        bodyText: request.bodyText,
        visibility: fromProtoAnnotationVisibility(request.visibility)
      })
      return { annotation: presentAnnotation(annotation) }
    } catch (error) {
      mapAnnotationError(error)
    }
  }

  async deleteAnnotation(request: DeleteAnnotationRequest): Promise<DeleteAnnotationResponse> {
    try {
      const annotation = await this.annotationCommandService.deleteAnnotation({
        ...requireAnnotationCommandContext(request),
        annotationId: request.annotationId ?? '',
        deleteReason: request.deleteReason
      })
      return { annotation: presentAnnotation(annotation) }
    } catch (error) {
      mapAnnotationError(error)
    }
  }

  async setAnnotationPinned(
    request: SetAnnotationPinnedRequest
  ): Promise<SetAnnotationPinnedResponse> {
    try {
      const annotation = await this.annotationCommandService.setAnnotationPinned({
        ...requireAnnotationCommandContext(request),
        annotationId: request.annotationId ?? '',
        pinned: Boolean(request.pinned)
      })
      return { annotation: presentAnnotation(annotation) }
    } catch (error) {
      mapAnnotationError(error)
    }
  }
}

AuthorizeBusinessRpc({ all: ['collaboration.annotation.create'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })(
  AnnotationCommandGrpcController.prototype,
  'createAnnotation',
  Object.getOwnPropertyDescriptor(AnnotationCommandGrpcController.prototype, 'createAnnotation')!
)
AuthorizeBusinessRpc({ all: ['collaboration.annotation.manage'] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })(
  AnnotationCommandGrpcController.prototype,
  'setAnnotationPinned',
  Object.getOwnPropertyDescriptor(AnnotationCommandGrpcController.prototype, 'setAnnotationPinned')!
)
for (const method of ['updateAnnotation', 'deleteAnnotation'] as const) {
  AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'WEB' })(
    AnnotationCommandGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(AnnotationCommandGrpcController.prototype, method)!
  )
}
