import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  CORS_ORIGIN: Joi.string().required(),
  PORT: Joi.number().optional(),
});

export const appConfig = () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN,
  databaseUrl: process.env.DATABASE_URL,
});
