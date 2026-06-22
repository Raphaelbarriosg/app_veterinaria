import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponse } from './dto/health.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API is healthy',
    type: HealthCheckResponse,
  })
  @ApiResponse({ status: 503, description: 'API is unhealthy' })
  checkHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'veterinaria-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}