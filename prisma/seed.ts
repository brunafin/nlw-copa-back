import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Bruna',
      email: 'bruna.f.n@hotmail.com',
      avatar: 'https://github.com/brunafinSD',
      createdAt: new Date(),
    }
  })

  const poll = await prisma.poll.create({
    data: {
      title: 'Bolão da Bru',
      code: 'Bol152',
      ownerId: user.id,
      participants: {
        create: {
          userId: user.id
        }
      }
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-04T12:00:00.051Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'DE'
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-05T12:00:00.051Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'AR',
      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 1,
          participant: {
            connect: {
              userId_pollId: {
                userId: user.id,
                pollId: poll.id,
              }
            }
          }
        }
      }
    }
  })
}

main()