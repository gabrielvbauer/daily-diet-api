import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { hash } from 'bcrypt'
import { checkIfUserIsAuthenticated } from '../hooks/check-if-user-is-authenticated'

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

  app.delete('/', async (request) => {
    await knex('users').delete()
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

    const encyptedPassword = await hash(password, 10)

    await knex('users').insert({
      id: randomUUID(),
      name,
      username,
      password: encyptedPassword,
      avatar_url: avatarUrl,
    })

    return reply.status(201).send()
  })

  app.get(
    '/metrics',
    { preHandler: checkIfUserIsAuthenticated },
    async (request, reply) => {
      const userId = request.headers.userId as string

      if (!userId) {
        return reply.status(400).send({ error: 'User id not specified' })
      }

      const meals = await knex('meals').select('*').where('user_id', userId)

      let metrics = {
        mealsAmount: 0,
        mealsWithinDiet: 0,
        mealsOutsideDiet: 0,
        mealsWithinDietPercentage: 0,
        bestStreakInDiet: 0,
      }

      if (meals.length === 0) {
        return reply.status(200).send({ metrics })
      }

      const mealsAmount = meals.length
      const mealsWithinDiet = meals.filter((meal) => meal.in_diet).length
      const mealsOutsideDiet = mealsAmount - mealsWithinDiet
      const mealsWithinDietPercentage = (mealsWithinDiet / mealsAmount) * 100
      let currentStreakWithinDiet = 0
      let bestStreakWithinDiet = 0

      const sortedMeals = meals.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )

      for (let i = 0; i < mealsAmount; i++) {
        if (sortedMeals[i].in_diet) {
          currentStreakWithinDiet++
          if (currentStreakWithinDiet > bestStreakWithinDiet) {
            bestStreakWithinDiet = currentStreakWithinDiet
          }
        } else {
          currentStreakWithinDiet = 0
        }
      }

      metrics = {
        mealsAmount,
        mealsWithinDiet,
        mealsOutsideDiet,
        bestStreakInDiet: bestStreakWithinDiet,
        mealsWithinDietPercentage,
      }

      reply.status(200).send({
        metrics,
      })
    },
  )
}
