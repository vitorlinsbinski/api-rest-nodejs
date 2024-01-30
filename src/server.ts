import fastify from 'fastify';
import cookie from '@fastify/cookie';

import { env } from './env';
import { transactionRoutes } from './routes/transactions';

const app = fastify();

app.register(cookie);

app.addHook('preHandler', async (req) => {
  console.log(`[${req.method}] ${req.url}`);
});

app.register(transactionRoutes, {
  prefix: '/transactions',
});

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server is running on port 3333...');
  });
