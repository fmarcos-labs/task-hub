import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CacheStatusDto {
  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  lastRefreshAt!: string | null;

  @ApiPropertyOptional({ example: 120 })
  ageSeconds!: number | null;

  @ApiProperty({ example: 5 })
  taskCount!: number;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({ example: 1234.56 })
  uptime!: number;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  timestamp!: string;

  @ApiProperty({ type: CacheStatusDto })
  cache!: CacheStatusDto;
}
