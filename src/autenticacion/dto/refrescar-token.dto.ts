import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefrescarTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
