/* eslint-disable '@typescript-eslint/no-unsafe-call' */

import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1, { message: 'First name is required.' })
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Last name is required.' })
  lastName!: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password!: string;
}
