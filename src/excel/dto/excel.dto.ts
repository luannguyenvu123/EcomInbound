import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;
}
