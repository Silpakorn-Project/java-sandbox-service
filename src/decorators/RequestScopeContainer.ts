import { createParamDecorator } from "routing-controllers";
import Container from "typedi";

export function RequestScopeContainer() {
    return createParamDecorator({
        value: (action) => {
            return Container.of(action.context.requestId);
        },
    });
}
