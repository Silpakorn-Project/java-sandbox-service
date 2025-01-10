import { createParamDecorator } from "routing-controllers";
import Container from "typedi";
import * as uuid from "uuid";

export function RequestScopeContainer() {
    return createParamDecorator({
        value: (action) => {
            const requestId = action.request.headers["x-request-id"] ?? uuid.v4;
            return Container.of(requestId);
        },
    });
}
