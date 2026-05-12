export type HealthStatus = "ok" | "degraded" | "error";

export type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  services: {
    database: "ok" | "error";
  };
};
