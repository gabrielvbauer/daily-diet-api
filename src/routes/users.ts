import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

export async function userRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const users = await knex('users').select()

    return { users }
  })

  app.post('/register', async (request, reply) => {
    const createNewUserSchema = z.object({
      name: z.string(),
      avatarUrl: z.string().url(),
    })

    const { name, avatarUrl } = createNewUserSchema.parse(request.body)

    await knex('users').insert({
      id: randomUUID(),
      name,
      avatar_url: avatarUrl,
    })

    return reply.status(201).send()
  })
}
