import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import path from 'path';
import { AppModule } from './app.module';
import { appRouter } from './adapters/inbound/trpc/router';
import { PRINCIPLE_PORT, DECK_PORT } from './domain/ports/injection-tokens';
import { IPrinciplePort } from './domain/ports/inbound/IPrinciplePort';
import { IDeckPort } from './domain/ports/inbound/IDeckPort';

// Route prefixes owned by the backend — kept in sync with the @Controller
// prefixes and the tRPC mount below.
const API_PREFIXES = ['/trpc', '/health', '/principles', '/decks', '/webhooks'];

async function bootstrap() {
  // rawBody is required to verify GitHub's x-hub-signature-256, which is an
  // HMAC over the exact bytes received — the parsed body cannot reproduce them.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.enableCors();

  const principlePort = app.get<IPrinciplePort>(PRINCIPLE_PORT);
  const deckPort = app.get<IDeckPort>(DECK_PORT);

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: () => ({ principlePort, deckPort }),
    }),
  );

  if (process.env.NODE_ENV === 'production') {
    const publicDir = path.join(__dirname, '..', 'public');
    app.useStaticAssets(publicDir);
    // The SPA fallback must not swallow the API: every GET that is not an API
    // route gets index.html so client-side routes survive a page reload, while
    // /health (the container healthcheck) and the REST controllers stay reachable.
    app.use((req: any, res: any, next: any) => {
      const isApiRoute = API_PREFIXES.some(
        (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
      );
      if (req.method === 'GET' && !isApiRoute) {
        res.sendFile(path.join(publicDir, 'index.html'));
      } else {
        next();
      }
    });
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`DARE server running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
