import { ConfigService } from "@nestjs/config";
import { createNestApp } from "./core/http/create-nest-app";

async function bootstrap(): Promise<void> {
  const app = await createNestApp();

  const port = app.get(ConfigService).get<number>("port", 3000);
  await app.listen(port, "0.0.0.0");

  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
