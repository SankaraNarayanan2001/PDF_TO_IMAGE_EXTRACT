const Joi = require('joi');
const appError = require('../utils/appError');

const validation = (req, res, next) => {
  const info = Joi.object({
    User_id: Joi.number().integer().positive(),
    Email: Joi.string().email().required(),
    Password: Joi.string().required()
  });

  const { error: infoError } = info.validate(req.body);

  if (infoError) {
    return next(new appError(404, infoError.details[0].message));
  }

  next();
};



module.exports = validation;
