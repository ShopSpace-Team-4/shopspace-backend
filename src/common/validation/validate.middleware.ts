import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { BadRequestException } from '../exceptions';

type Source = 'body' | 'params' | 'query';

// Generic validator: pass it a Joi schema and which part of the request to
// validate. Every *.validation.ts file exports schemas built for this.
export const validate =
  (schema: ObjectSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      throw new BadRequestException(message);
    }

    req[source] = value;
    next();
  };
