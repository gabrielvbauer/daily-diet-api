import { FastifyInstance } from 'fastify'
import { env } from '../env'
import { z } from 'zod'
import { knex } from '../database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const loginRequestSchema = z.object({
      username: z.string().toLowerCase(),
      password: z.string(),
    })

    const { username, password } = loginRequestSchema.parse(request.body)

    const userInfo = await knex('users').where('username', username).first()

    if (!userInfo) {
      return reply.status(404).send({ error: 'User not found' })
    }

    const isPasswordValid = await bcrypt.compare(password, userInfo.password)

    if (!isPasswordValid) {
      return reply.status(400).send({ error: 'Incorrect password' })
    }

    const token = await jwt.sign(
      {
        sub: userInfo.id,
      },
      env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    )

    return reply.send({ token })
  })
}
