import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Dados do usuário',
  })
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
