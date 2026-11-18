import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { FeedbackCategory } from '../../generated/prisma/enums.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Body of POST /api/v1/feedback. */
export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackCategory, example: FeedbackCategory.IDEA })
  @IsEnum(FeedbackCategory)
  category!: FeedbackCategory;

  @ApiProperty({
    example: 'It would be great to sort plants by the next watering date.',
    minLength: 1,
    maxLength: 2000,
  })
  @Transform(trim)
  @IsString()
  @Length(1, 2000)
  message!: string;

  @ApiPropertyOptional({
    description: 'App path the feedback was sent from, without the domain',
    example: '/plants/new',
    maxLength: 200,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  @Matches(/^\//, { message: 'page must be a path starting with "/"' })
  page?: string;
}
