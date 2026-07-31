const { ApiError } = require("../utils/apiResponse");

// validate(schema) expects a Zod schema shaped like:
//   z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })
// Only include the keys you actually want validated.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    return next(new ApiError(422, "Validation failed", details));
  }

  // Overwrite with parsed (and coerced/defaulted) values.
  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

module.exports = validate;
