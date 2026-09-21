import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional({ description: 'Custom display name for the media' })
  name?: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  filepath: string;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
