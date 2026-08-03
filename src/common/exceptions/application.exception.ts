export class ApplicationException extends Error {
    constructor(message: string, public statusCode: number, cause?: unknown) {
        super(message, { cause });
        console.log(this.constructor);
        console.log(this.name);
        this.name = this.constructor.name //to tell me the name of the class error
        Error.captureStackTrace(this, this.constructor) //to capture the stack path
    }
}
