import { createParamDecorator } from "routing-controllers";

export function RequestScopeContainer() {
    return createParamDecorator({
        value: (action) => {
            const container = action.context.state.container;
            if (!container) {
                throw new Error("Request-scoped container not found");
            }
            return container;
        },
    });
}
