import { HttpError } from "@app/types/HttpError";

export class BadRequestError extends HttpError {
    constructor(
        message: string = "Invalid request, please check your request data and try again.",
    ) {
        super(400, message);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(
        message: string = "Unauthorized, please provide valid authentication credentials.",
    ) {
        super(401, message);
    }
}

export class ForbiddenError extends HttpError {
    constructor(
        message: string = "Forbidden, you don't have permission to access this resource.",
    ) {
        super(403, message);
    }
}

export class NotFoundError extends HttpError {
    constructor(
        message: string = "Resource not found, please check the URL and try again.",
    ) {
        super(404, message);
    }
}

export class InternalServerError extends HttpError {
    constructor(
        message: string = "Something went wrong, please try again later.",
    ) {
        super(500, message);
    }
}
