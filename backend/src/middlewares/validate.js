/**
 * Generic Joi request validation middleware
 * @param {Object} schema Joi schema
 * @param {'body'|'query'|'params'} source Target property on request
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details,
      });
    }

    req[source] = value;
    next();
  };
};
