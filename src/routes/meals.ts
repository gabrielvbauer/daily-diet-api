import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkIfUserIsAuthenticated } from '../hooks/check-if-user-is-authenticated'
import { knex } from '../database'

export async function mealRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (request, reply, done) => {
    checkIfUserIsAuthenticated(request, reply, done)
  })

  app.get('/', async (request, reply) => {
    const userId = request.headers.userId as string

    const meals = await knex('meals').select().where({
      user_id: userId,
    })

    return reply.status(200).send({ meals })
  })

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      createdAt: z.string(),
      inDiet: z.boolean(),
    })

    const meal = createMealBodySchema.parse(request.body)
    const userId = request.headers.userId as string

    const createdMealResponse = await knex('meals')
      .insert({
        id: randomUUID(),
        name: meal.name,
        description: meal.description,
        created_at: meal.createdAt,
        in_diet: meal.inDiet,
        user_id: userId,
      })
      .returning('id')

    if (!createdMealResponse) {
      return reply
        .status(400)
        .send({ error: 'An error occurred while creating a new meal' })
    }

    return reply.status(204).send()
  })
}
