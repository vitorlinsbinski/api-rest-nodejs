import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

// Cookies -> Formas de manter contexto entre requisições
// Muitos websites armazenam um id durante a navegação
// Com esse id, é possível validar que uma mesma pessoa fez certas requisições

// Testes unitários: testam exclusivamente uma unidade da aplicação de forma isolada, sem contexto
// Testes de integração: testam a comunicação entre duas ou mais unidades
// Testes E2E (End-to-end): testes que simulam um usuário operando a aplicação

// E2E no Front-end: abre a página de log-in, digite o texto (email) no campo com id email, e depois clique no botão , ...
// E2E no Back-end: o usuário (front-end) faz chamadas HTTP, websockets, API end-points

// Pirâmide de testes: E2E (não dependem de nenhuma tecnologia, nenhuma arquitetura de software)
// E2E são testes lentos

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    const { sessionId } = req.cookies;

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select();

    return { transactions };
  });

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (req) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(req.params);

    const { sessionId } = req.cookies;

    const transaction = await knex('transactions')
      .where({ session_id: sessionId, id })
      .first();

    return { transaction };
  });

  app.get('/summary', { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies;

    const summary = await knex('transactions')
      .where('session_id', sessionId)
      .sum('amount', { as: 'amount' })
      .first();

    return { summary };
  });

  app.post('/', async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(req.body);

    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    });

    // HTTP codes
    // 201 - Recurso criado com sucesso!

    return res.status(201).send();
  });
}
