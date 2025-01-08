import { Get, JsonController } from "routing-controllers";

@JsonController("/")
export class HealthCheckController {
    @Get("/")
    async status() {
        return { message: "OK" };
    }
}
