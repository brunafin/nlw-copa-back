import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import z from 'zod';
import ShortUniqueId from 'short-unique-id';
import { join } from 'path';
import { authenticate } from '../plugins/authenticate';

export async function pollRoutes(fastify: FastifyInstance) {
  fastify.get('/polls/count', async () => {
    const count = await prisma.poll.count()
    return { count };
  })

  fastify.get('/polls', {
    onRequest: [authenticate]
  }, async (request) => {
    const polls = await prisma.poll.findMany({
      where: {
        participants: {
          some: {
            userId: '1'
          }
        }
      },
      include: {
        _count: {
          select: {
            participants: true
          }
        },
        participants: {
          select: {
            id: true,

            user: {
              select: {
                avatar: true
              }
            }
          },
          take: 4,
        },
        owner: true
      }
    })

    return { polls }
  })

  fastify.get('/polls/:id', {
    onRequest: [authenticate]
  }, async (request) => {
    const getPollParams = z.object({
      id: z.string(),
    })

    const { id } = getPollParams.parse(request.params);

    const poll = await prisma.poll.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            participants: true
          }
        },
        participants: {
          select: {
            id: true,

            user: {
              select: {
                avatar: true
              }
            }
          },
          take: 4,
        },
        owner: true
      }
    })

    return { poll }
  })

  fastify.post('/polls/join', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const joinPollBody = z.object({
      code: z.string(),
    })

    const { code } = joinPollBody.parse(request.body);

    const poll = await prisma.poll.findUnique({
      where: {
        code,
      },
      // include: {
      //   participants:{
      //     where:{
      //       userId: usuário logado
      //     }
      //   }
      // }
    })

    if (!poll) {
      return reply.status(400).send({
        message: 'Bolão não encontrado'
      })
    }

    // if (poll.participants.length > 0) {
    //   return reply.status(400).send({
    //     message: 'O participante já existe no bolão'
    //   })
    // }

    if (!poll.ownerId) {
      await prisma.poll.update({
        where: {
          id: poll.id
        },
        data: {
          ownerId: request.user.sub
        }
      })
    }

    await prisma.participant.create({
      data: {
        pollId: poll.id,
        userId: ''
      }
    })

    return reply.status(201).send()
  })

  fastify.post('/polls', async (request, reply) => {
    const createPollBody = z.object({
      title: z.string(),
    })
    const { title } = createPollBody.parse(request.body);
    const generate = new ShortUniqueId({ length: 6 });
    const code = String(generate()).toLocaleUpperCase();

    let ownerId = null;

    try {
      await prisma.poll.create({
        data: {
          title,
          code,
          ownerId: request.user.sub,

          participants: {
            create: {
              userId: request.user.sub
            }
          }
        }
      })
    } catch {
      await prisma.poll.create({
        data: {
          title,
          code
        }
      })

    }


    return reply.status(201).send({ code });
  })
}