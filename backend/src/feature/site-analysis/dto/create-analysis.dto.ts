import { IsString, MinLength } from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @MinLength(4)
  url!: string;
}
