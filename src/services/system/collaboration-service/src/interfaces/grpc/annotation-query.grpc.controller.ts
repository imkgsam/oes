import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { AuthorizeSelfServiceRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AnnotationQueryServiceController,
  AnnotationQueryServiceControllerMethods,
  GetAnnotationRequest,
  GetAnnotationResponse,
  ListAnnotationsForObjectRequest,
  ListAnnotationsForObjectResponse
} from '@oes/common/generated/collaboration_service'
import { AnnotationQueryService } from '../../application/services/annotation-query.service'
import {
  fromProtoObjectRef,
  mapAnnotationError,
  requireAnnotationQueryContext
} from './annotation-grpc.mapping'
import { presentAnnotation } from './annotation-grpc.presenter'

/** AnnotationQueryGrpcController exposes Annotation P1 read queries over internal gRPC. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@AnnotationQueryServiceControllerMethods()
export class AnnotationQueryGrpcController implements AnnotationQueryServiceController {
  constructor(private readonly annotationQueryService: AnnotationQueryService) {}

  async listAnnotationsForObject(
    request: ListAnnotationsForObjectRequest
  ): Promise<ListAnnotationsForObjectResponse> {
    try {
      const result = await this.annotationQueryService.listAnnotationsForObject({
        ...requireAnnotationQueryContext(request),
        objectRef: fromProtoObjectRef(request.objectRef),
        includePrivate: request.includePrivate,
        page: request.page,
        pageSize: request.pageSize
      })
      return {
        items: result.items.map(presentAnnotation),
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    } catch (error) {
      mapAnnotationError(error)
    }
  }

  async getAnnotation(request: GetAnnotationRequest): Promise<GetAnnotationResponse> {
    try {
      const annotation = await this.annotationQueryService.getAnnotation({
        ...requireAnnotationQueryContext(request),
        annotationId: request.annotationId ?? ''
      })
      return { annotation: presentAnnotation(annotation) }
    } catch (error) {
      mapAnnotationError(error)
    }
  }
}

for (const method of ['listAnnotationsForObject', 'getAnnotation'] as const) {
  AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminals: ['WEB'] })(
    AnnotationQueryGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(AnnotationQueryGrpcController.prototype, method)!
  )
}
