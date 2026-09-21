import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchQueryDto } from '@shared/dto/pagination.dto';

export class ProductQueryDto extends SearchQueryDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'out_of_stock'] })
  @IsEnum(['active', 'inactive', 'out_of_stock'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'out_of_stock';

  @ApiPropertyOptional()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0, { message: 'Minimum price must be non-negative' })
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0, { message: 'Maximum price must be non-negative' })
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;
}
