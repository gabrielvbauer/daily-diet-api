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

    const isPasswordValid = await Promise.all([
      bcrypt.compare(password, userInfo.password),
      bcrypt.compare(password, userInfo.password),
      bcrypt.compare(password, userInfo.password),
    ]).then((results) => results.some((result) => result === true))

    if (!isPasswordValid) {
      return reply.status(400).send({ error: 'Incorrect password' })
    }

    const accessToken = await jwt.sign(
      {
        sub: userInfo.id,
      },
      env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    )

    const refreshToken = await jwt.sign(
      {
        sub: userInfo.id,
      },
      env.JWT_SECRET,
      {
        expiresIn: '30d',
      },
    )

    reply.cookie('jwt-accessToken', accessToken, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 1, // 1 hour
    })
    reply.cookie('jwt-refreshToken', refreshToken, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    })

    return reply.send({ accessToken, refreshToken })
  })

  app.post('/refresh-token', async (request, reply) => {
    const refreshToken = request.cookies['jwt-refreshToken']

    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token not available' })
    }

    jwt.verify(refreshToken, env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return reply.status(400).send({ error: error.message })
      }

      const newAccessToken = jwt.sign(
        {
          sub: decoded?.sub,
        },
        env.JWT_SECRET,
        {
          expiresIn: '1h',
        },
      )

      reply.cookie('jwt-accessToken', newAccessToken, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 1, // 1 hour
      })

      return reply.status(200).send({ accessToken: newAccessToken })
    })
  })
}
