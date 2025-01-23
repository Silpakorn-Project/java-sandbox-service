import { Get, JsonController } from "routing-controllers";

@JsonController("/sandbox")
export class HealthCheckController {
    @Get("/")
    async status() {
        return { message: "OK" };
    }
}
