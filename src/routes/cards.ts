import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function cardRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // -----------------------------------------------------------
  // Schema reutilizável para o parâmetro :id da URL
  // -----------------------------------------------------------
  const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
  });

  // ===========================================================
  // ROTA 1 - POST /cards  (Criar card)              [3,0 pts]
  // ===========================================================
  const createCardSchema = z.object({
    question: z.string().min(3),
    answer: z.string().min(1),
    deckId: z.number().int().positive(),
  });

  server.post(
    "/cards",
    {
      schema: {
        body: createCardSchema,
      },
    },
    async (request, reply) => {
      const { question, answer, deckId } = request.body;

      const deck = await prisma.deck.findUnique({
        where: { id: deckId },
      });

      if (!deck) {
        return reply.status(404).send({ message: "Baralho não encontrado" });
      }

      const card = await prisma.card.create({
        data: {
          question,
          answer,
          deckId,
        },
      });

      return reply.status(201).send(card);
    },
  );

  // ===========================================================
  // ROTA 2 - GET /cards  (Listar cards)             [2,0 pts]
  // ===========================================================
  server.get("/cards", async (request, reply) => {
    const cards = await prisma.card.findMany({
      orderBy: { id: "asc" },
      include: {
        deck: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return reply.status(200).send(cards);
  });

  // ===========================================================
  // ROTA 3 - GET /cards/:id  (Buscar card por ID)   [2,0 pts]
  // ===========================================================
  server.get(
    "/cards/:id",
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const card = await prisma.card.findUnique({
        where: { id },
        include: {
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!card) {
        return reply.status(404).send({ message: "Card não encontrado" });
      }

      return reply.status(200).send(card);
    },
  );

  // ===========================================================
  // ROTA 4 - DELETE /cards/:id  (Remover card)      [2,0 pts]
  // ===========================================================
  server.delete(
    "/cards/:id",
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const card = await prisma.card.findUnique({
        where: { id },
      });

      if (!card) {
        return reply.status(404).send({ message: "Card não encontrado" });
      }

      await prisma.card.delete({
        where: { id },
      });

      return reply.status(200).send({ message: "Card removido com sucesso" });
    },
  );

  // ===========================================================
  // BÔNUS - POST /cards/:id/review  (Registrar revisão) [+1,0]
  // ===========================================================
  const reviewSchema = z.object({
    grade: z.number().int().min(1).max(5),
  });

  server.post(
    "/cards/:id/review",
    {
      schema: {
        params: paramsSchema,
        body: reviewSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { grade } = request.body;

      const card = await prisma.card.findUnique({
        where: { id },
      });

      if (!card) {
        return reply.status(404).send({ message: "Card não encontrado" });
      }

      const updatedCard = await prisma.card.update({
        where: { id },
        data: {
          reviewCount: { increment: 1 },
          lastGrade: grade,
          lastReviewedAt: new Date(),
        },
      });

      return reply.status(200).send(updatedCard);
    },
  );
}

