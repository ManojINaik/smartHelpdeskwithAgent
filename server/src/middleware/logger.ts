import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare module 'express-serve-static-core' {
  interface Request {
    traceId?: string;
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const incomingTraceId = (req.headers['x-trace-id'] as string) || undefined;
  req.traceId = incomingTraceId || randomUUID();

  res.setHeader('x-trace-id', req.traceId);

  const { method, originalUrl } = req;
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const log = {
      level: 'info',
      traceId: req.traceId,
      method,
      path: originalUrl,
      status: res.statusCode,
      durationMs,
      time: new Date().toISOString()
    };
    // Structured log
    console.log(JSON.stringify(log));
  });

  next();
}

export default requestLogger;


