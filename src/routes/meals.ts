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

  app.get('/:id', async (request, reply) => {
    const requestParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id: mealId } = requestParamsSchema.parse(request.params)

    if (!mealId) {
      return reply.status(404).send({ error: 'Id was not specified' })
    }

    const mealToRetrieve = await knex('meals')
      .select()
      .where('id', mealId)
      .first()

    if (!mealToRetrieve) {
      return reply.status(404).send({ error: 'Meal was not found' })
    }

    const userId = request.headers.userId as string
    const mealBelongsToUser = checkIfMealBelongsToUser(
      userId,
      mealToRetrieve.user_id,
    )

    if (!mealBelongsToUser) {
      return reply.status(403).send({ error: 'Meal is not from the user' })
    }

    return reply.status(200).send({ meal: mealToRetrieve })
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

  app.patch('/:id', async (request, reply) => {
    const requestParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id: mealId } = requestParamsSchema.parse(request.params)

    if (!mealId) {
      return reply.status(404).send({ error: 'Id was not specified' })
    }

    const mealToUpdate = await knex('meals')
      .select('*')
      .where('id', mealId)
      .first()

    if (!mealToUpdate) {
      return reply.status(404).send({ error: 'Meal not found' })
    }

    const userId = request.headers.userId as string
    const mealBelongsToUser = checkIfMealBelongsToUser(
      userId,
      mealToUpdate.user_id,
    )

    if (!mealBelongsToUser) {
      return reply.status(403).send({ error: 'Meal is not from the user' })
    }

    const requestBodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      inDiet: z.boolean().optional(),
    })

    const updateBody = requestBodySchema.parse(request.body)

    if (!updateBody) {
      return reply.status(404).send({ error: 'Missing body' })
    }

    const updatedMeal = await knex('meals')
      .where('id', mealId)
      .update({
        name: updateBody.name,
        description: updateBody.description,
        created_at: updateBody.date,
        in_diet: updateBody.inDiet,
      })
      .returning('*')

    reply.status(200).send({ meal: updatedMeal[0] })
  })

  app.delete('/:id', async (request, reply) => {
    const requestParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id: mealId } = requestParamsSchema.parse(request.params)

    if (!mealId) {
      return reply.status(404).send({ error: 'Id was not specified' })
    }

    const mealToDelete = await knex('meals')
      .select()
      .where('id', mealId)
      .first()

    if (!mealToDelete) {
      return reply.status(404).send({ error: 'Meal was not found' })
    }

    const userId = request.headers.userId as string
    const mealBelongsToUser = checkIfMealBelongsToUser(
      userId,
      mealToDelete.user_id,
    )

    if (!mealBelongsToUser) {
      return reply.status(403).send({ error: 'Meal is not from the user' })
    }

    await knex('meals').where('id', mealId).del()

    return reply.status(204).send()
  })

  function checkIfMealBelongsToUser(userId: string, mealUserId: string) {
    return userId === mealUserId
  }
}
