import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
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
  @ApiServiceUnavailableResponse({
    description: "Service dégradé (dépendance indisponible)",
    type: HealthResponseDto,
  })
  async getHealth(@Res({ passthrough: true }) res: FastifyReply): Promise<HealthResponse> {
    const result = await this.healthService.getHealth();
    if (result.status === "degraded") {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
