import { NextFunction, Request, Response } from "express"
import { BadRequestException } from "../common/exceptions"
import { ZodType } from "zod"
import { ZodError } from "zod"
//// 4. KeyReqType means: the keys can only be things inside the Express Request object (like 'body', 'query', 'params')
type KeyReqType = keyof Request
type SchemaType = Partial<Record<KeyReqType, ZodType>>

// IssuesType defines how the final error response will look when validation fails
type IssuesType = Array<{
    key: KeyReqType,
    issues: Array<{
        path: Array<(string | number | symbol | undefined | null)>,
        message: string
    }>
}>
//  This is the main function. You pass your Zod schema to it (validation({ body: userSchema }))
export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log(Object.keys(schema)); //body
        //  Create an empty array to collect any validation errors found
        const issues: IssuesType = []
        // Loop through each key defined in your schema object (e.g., first 'body', then 'query' if it exists)
        for (const key of Object.keys(schema) as KeyReqType[]) {
            //  If the current key doesn't have a schema defined, skip and go to the next key
            if (!schema[key]) continue;
            // Zod checks the actual data in the request (like req.body) against your schema rules
            // .safeParse() ensures it won't crash the app if validation fails; it just returns a success status
            const validationResult = schema[key].safeParse(req[key])
            if (!validationResult.success) {
                //  Cast the error object into a ZodError type so we can read its details
                const error = validationResult.error as ZodError
                // Push the bad fields, their exact paths, and the error messages into our main 'issues' array
                issues.push({ key, issues: error.issues.map(issue => { return { path: issue.path, message: issue.message } }) })
            }
        }
        //   After checking everything, if our 'issues' array is NOT empty (meaning we found errors)

        if (issues.length) {
            throw new BadRequestException("validation error ", { issues })

        }
        //  If there are NO errors at all, call next() to pass the clean data to the next Middleware or Controller


        next()
    }


}


//Validation Middleware. Its only job is to check the data coming from the user (client) before it reaches your main logic (Controller). If the data is correct, it lets it pass; if it has mistakes, it blocks the request.