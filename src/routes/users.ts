import { randomInt, randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { hash } from 'bcrypt'

export async function userRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const users = await knex('users').select(
      'id',
      'name',
      'username',
      'avatar_url',
    )

    return { users }
  })

  app.post('/register', async (request, reply) => {
    const createNewUserSchema = z.object({
      name: z.string(),
      username: z.string(),
      password: z.string(),
      avatarUrl: z.string().url(),
    })

    const { name, username, password, avatarUrl } = createNewUserSchema.parse(
      request.body,
    )

    const encyptedPassword = await hash(password, randomInt(10, 20))

    await knex('users').insert({
      id: randomUUID(),
      name,
      username,
      password: encyptedPassword,
      avatar_url: avatarUrl,
    })

    return reply.status(201).send()
  })
}
