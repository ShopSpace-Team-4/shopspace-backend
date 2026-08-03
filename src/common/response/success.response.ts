import { Response } from "express"
export const successResponse = <T>({
    res,
    message = "success",
    status = 200,
    data

}: {
    res: Response
    message?: string
    status?: number,
    data?: T

}) => {
    return res.status(status).json({
        message,
        status,
        data
    })
}