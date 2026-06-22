import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponse {
  @ApiProperty({ example: 'ok', description: 'Health status' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Current timestamp' })
  timestamp: string;

  @ApiProperty({ example: 'veterinaria-api', description: 'Service name' })
  service: string;

  @ApiProperty({ example: '1.0.0', description: 'API version' })
  version: string;

  @ApiProperty({ example: 'development', description: 'Environment' })
  environment: string;
}