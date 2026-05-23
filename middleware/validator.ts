import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  ZodObject,
} from "zod";

export const validate =
  (schema: ZodObject) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {

      return res.status(400).json({
        success: false,
        errors: result.error.flatten(),
      });
    }

    if (result.data.body) {
      req.body = result.data.body;
    }

    if (result.data.params) {
      req.params = result.data.params as Request["params"];
    }

  

    next();
  };