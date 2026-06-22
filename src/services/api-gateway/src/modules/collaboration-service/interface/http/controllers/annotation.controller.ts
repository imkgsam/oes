import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { AnnotationBffService } from '../../../application/annotation-bff.service'
import {
  CreateAnnotationDto,
  DeleteAnnotationDto,
  ListAnnotationsDto,
  SetAnnotationPinnedDto,
  UpdateAnnotationDto
} from '../dtos/annotation.dto'

/** AnnotationController exposes object-scoped Annotation P1 routes through the API Gateway. */
@ApiBearerAuth('JWT')
@ApiTags('collaboration-annotations')
@Controller('collaboration')
export class AnnotationController {
  constructor(private readonly annotationBffService: AnnotationBffService) {}

  @Get('objects/:ownerService/:objectType/:objectId/annotations')
  @ApiOperation({ summary: 'List object Annotation P1 notes' })
  listAnnotationsForObject(
    @Param('ownerService') ownerService: string,
    @Param('objectType') objectType: string,
    @Param('objectId') objectId: string,
    @Query() query: ListAnnotationsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.annotationBffService.listAnnotationsForObject(ownerService, objectType, objectId, query, source)
  }

  @Post('objects/:ownerService/:objectType/:objectId/annotations')
  @ApiOperation({ summary: 'Create an object Annotation P1 note' })
  createAnnotation(
    @Param('ownerService') ownerService: string,
    @Param('objectType') objectType: string,
    @Param('objectId') objectId: string,
    @Body() body: CreateAnnotationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.annotationBffService.createAnnotation(ownerService, objectType, objectId, body, source)
  }

  @Patch('annotations/:annotationId')
  @ApiOperation({ summary: 'Update an Annotation P1 note owned by the author' })
  updateAnnotation(
    @Param('annotationId') annotationId: string,
    @Body() body: UpdateAnnotationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.annotationBffService.updateAnnotation(annotationId, body, source)
  }

  @Delete('annotations/:annotationId')
  @ApiOperation({ summary: 'Soft-delete an Annotation P1 note' })
  deleteAnnotation(
    @Param('annotationId') annotationId: string,
    @Body() body: DeleteAnnotationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.annotationBffService.deleteAnnotation(annotationId, body ?? {}, source)
  }

  @Patch('annotations/:annotationId/pinned')
  @ApiOperation({ summary: 'Set object-level Annotation P1 pin state' })
  setAnnotationPinned(
    @Param('annotationId') annotationId: string,
    @Body() body: SetAnnotationPinnedDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.annotationBffService.setAnnotationPinned(annotationId, body, source)
  }
}
