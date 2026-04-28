import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SuggestUrlsDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Paramètre q manquant' })
  @IsNotEmpty({ message: 'Paramètre q manquant' })
  q!: string;
}
