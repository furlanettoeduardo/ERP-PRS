import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';

export enum LogType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export class QueryLogsDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, enum: LogType })
  @IsOptional()
  @IsEnum(LogType)
  type?: LogType;
}
