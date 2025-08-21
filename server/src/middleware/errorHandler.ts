import express from 'express';
import { AppError } from '../errors.js';

export function errorHandler(err: any, req: express.Request, res: express.Response, _next: express.NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details, traceId: req.traceId } });
  }
  // zod errors
  if (err?.issues && Array.isArray(err.issues)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.issues, traceId: req.traceId } });
  }

  console.error('Unhandled Error', { message: err?.message, stack: err?.stack, traceId: req.traceId });
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong', traceId: req.traceId } });
}

export default errorHandler;



