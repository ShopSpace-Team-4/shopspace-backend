import type { NextFunction, Request, Response } from "express"
interface IError extends Error {
    statusCode?: number
}
export const globalErrorHandler = (error: IError, req: Request, res: Response, next: NextFunction) => {
    const status = error.statusCode || 500
    return res.status(status).json({
        message: error.message || "something went wrong",
        error,
        cause: error.cause,
        stack: error.stack

    })
} 