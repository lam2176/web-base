import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderPageItemDto {
  @IsNumber()
  id: number;

  @IsNumber()
  order: number;
}

export class ReorderPagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderPageItemDto)
  pages: ReorderPageItemDto[];
}

