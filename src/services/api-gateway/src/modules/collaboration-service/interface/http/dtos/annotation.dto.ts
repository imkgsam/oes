import { Type } from 'class-transformer'
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export type AnnotationVisibilityDto = 'PRIVATE' | 'OBJECT_VISIBLE'

const ANNOTATION_VISIBILITIES: AnnotationVisibilityDto[] = ['PRIVATE', 'OBJECT_VISIBLE']
const BOOLEAN_QUERY_VALUES = ['true', 'false', true, false] as const

/** CreateAnnotationDto exposes only Annotation P1 pure-text creation fields to tenant-web. */
export class CreateAnnotationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyText!: string

  @IsOptional()
  @IsIn(ANNOTATION_VISIBILITIES)
  visibility?: AnnotationVisibilityDto
}

/** UpdateAnnotationDto exposes author-editable Annotation P1 fields. */
export class UpdateAnnotationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyText?: string

  @IsOptional()
  @IsIn(ANNOTATION_VISIBILITIES)
  visibility?: AnnotationVisibilityDto
}

/** DeleteAnnotationDto carries the optional governance deletion reason. */
export class DeleteAnnotationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deleteReason?: string
}

/** SetAnnotationPinnedDto carries the object-level pin state requested by managers. */
export class SetAnnotationPinnedDto {
  @IsBoolean()
  pinned!: boolean
}

/** ListAnnotationsDto captures Annotation P1 object notes paging options. */
export class ListAnnotationsDto {
  @IsOptional()
  @IsIn(BOOLEAN_QUERY_VALUES)
  includePrivate?: boolean | string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number | string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number | string
}
