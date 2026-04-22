/* eslint-disable '@typescript-eslint/no-unsafe-call' */

import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;
}
