import { ApiProperty } from '@nestjs/swagger';

/** Public view of a user. Never contains passwordHash. */
export class AuthUserDto {
  @ApiProperty({ example: '3f2b8c1e-6a4d-4e0f-9b7a-1c2d3e4f5a6b' })
  id!: string;

  @ApiProperty({ example: 'owner@example.com' })
  email!: string;
}

export class AccessTokenDto {
  @ApiProperty({
    description: 'JWT to send as "Authorization: Bearer <accessToken>"',
  })
  accessToken!: string;
}
