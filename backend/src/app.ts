import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isTest } from './config/env.js';
import { createContainer } from './container.js';
import type { DB } from './database/connection.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { createApiRouter } from './routes/index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(currentDir, '../../frontend/dist');

export function createApp(db: DB): Express {
  const app = express();
  const container = createContainer(db);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));
  if (!isTest) app.use(morgan('dev'));

  app.use('/api', createApiRouter(container));
  app.use('/api', notFoundHandler);

  // servir el frontend compilado
  if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
