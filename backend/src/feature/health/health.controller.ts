import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthResponseDto } from "./dto/health-response.dto";
import type { HealthResponse } from "./health.types";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiOkResponse({
    description: "État du service et des dépendances",
    type: HealthResponseDto,
  })
  getHealth(): Promise<HealthResponse> {
    return this.healthService.getHealth();
  }
}
