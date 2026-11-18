import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
} from 'class-validator';
import { PlantStatus } from '../../generated/prisma/enums.js';
import {
  CAUSE_CODES,
  SYMPTOM_CODES,
  type SymptomCode,
} from '../symptoms.catalog.js';

/** Body of PUT /api/v1/plants/:plantId/status. */
export class SetPlantStatusDto {
  @ApiProperty({ enum: PlantStatus, example: PlantStatus.NEEDS_ATTENTION })
  @IsIn(Object.values(PlantStatus))
  status!: PlantStatus;
}

/** Body of POST /api/v1/plants/:plantId/diagnosis. */
export class DiagnoseDto {
  @ApiProperty({
    enum: SYMPTOM_CODES,
    isArray: true,
    example: ['YELLOW_LEAVES', 'SOFT_STEM_OR_ROT'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SYMPTOM_CODES.length)
  @ArrayUnique()
  @IsIn(SYMPTOM_CODES, { each: true })
  symptoms!: SymptomCode[];
}

export class LocalizedTextDto {
  @ApiProperty({ example: 'Too much water' })
  en!: string;

  @ApiProperty({ example: 'Перелив' })
  uk!: string;
}

export class SymptomDto {
  @ApiProperty({ enum: SYMPTOM_CODES })
  code!: string;

  @ApiProperty({ type: LocalizedTextDto })
  title!: LocalizedTextDto;
}

export class DiagnosisCauseDto {
  @ApiProperty({ enum: CAUSE_CODES })
  cause!: string;

  @ApiProperty({ enum: ['HIGH', 'MEDIUM', 'LOW'] })
  confidence!: string;

  @ApiProperty({ example: 7 })
  score!: number;

  @ApiProperty({ type: LocalizedTextDto })
  title!: LocalizedTextDto;

  @ApiProperty({
    type: LocalizedTextDto,
    isArray: true,
    description: "Facts from the plant's own data that support this cause",
  })
  reasons!: LocalizedTextDto[];

  @ApiProperty({ type: LocalizedTextDto, isArray: true })
  actions!: LocalizedTextDto[];
}

export class DiagnosisDto {
  @ApiProperty({ example: '3f2b8c1e-6a4d-4e0f-9b7a-1c2d3e4f5a6b' })
  plantId!: string;

  @ApiProperty({ enum: SYMPTOM_CODES, isArray: true })
  symptoms!: string[];

  @ApiProperty({
    type: DiagnosisCauseDto,
    isArray: true,
    description: 'Most likely causes first, at most 3',
  })
  causes!: DiagnosisCauseDto[];

  @ApiProperty({
    enum: PlantStatus,
    description:
      'NEEDS_ATTENTION when a cause has HIGH or MEDIUM confidence, otherwise the current status. Not saved: the frontend may offer to set it.',
  })
  suggestedStatus!: PlantStatus;
}
