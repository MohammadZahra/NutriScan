import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from 'cors';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import scanItemRouter from './routes/scanItem.route';
import nutritionScoreRouter from './routes/nutritionScore.route';

export const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;


declare module 'express-session' {
  export interface SessionData {
    userId: number;
  }
}

const loginMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    const user = await prisma.user.create({});
    req.session.userId = user.id;
    console.log(`Session created for user ${user.id}`);
  } else {
    console.log(`Session found for user ${req.session.userId}`);
  }
  next();
}

async function main() {
  app.use(express.json());

  app.use(cors({
    origin: 'http://localhost:8000',
    methods: 'GET, POST',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  }));

  app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    })
  }));

  app.use(loginMiddleware);

  app.use((req, res, next) => {
    console.log('Incoming session:', req.session);
    next();
  });

  app.use('/api/scanItem', scanItemRouter);
  app.use('/api/nutritionScore', nutritionScoreRouter);

  app.all("*", (req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
