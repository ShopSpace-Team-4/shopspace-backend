
import { ApplicationException } from "./application.exception";
export class BadRequestException extends ApplicationException {
    constructor(message: string = "BadRequest!", cause?: unknown) {
        super(message, 400, cause);

    }
}
export class ConflictException extends ApplicationException {
    constructor(message: string = "Conflict!", cause?: unknown) {
        super(message, 409, cause);

    }
}
export class DuplicateResourceException extends ApplicationException {
    constructor(resource: string, field?: string, cause?: unknown) {
        const message = field
            ? `${resource} with this ${field} already exists`
            : `${resource} already exists`;
        super(message, 409, cause);

    }
}
export class NotFoundException extends ApplicationException {
    constructor(message: string = "Not Found!", cause?: unknown) {
        super(message, 404, cause);

    }
}
export class UnauthorizedException extends ApplicationException {
    constructor(message: string = "Unauthorized!", cause?: unknown) {
        super(message, 401, cause);

    }
}

export class ForbiddenException extends ApplicationException {
    constructor(message: string = "Forbidden!", cause?: unknown) {
        super(message, 403, cause);

    }
}
export class InternalServerErrorException extends ApplicationException {
    constructor(message: string = "Internal Server Error!", cause?: unknown) {
        super(message, 500, cause);

    }
}

export class ServiceUnavailableException extends ApplicationException {
    constructor(message: string = "Service Unavailable!", cause?: unknown) {
        super(message, 503, cause);

    }
}
