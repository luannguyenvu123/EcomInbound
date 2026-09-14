import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMappingDto {
  @ApiProperty({ example: '3NBDGHDDC001N' })
  @IsString()
  @IsNotEmpty()
  child: string;

  @ApiProperty({ example: '1NBDGVFDC31N' })
  @IsString()
  @IsNotEmpty()
  parent: string;
}

export class ImportMappingDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
