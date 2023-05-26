import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../env'

export async function checkIfUserIsAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void,
) {
  const token = request.cookies['jwt-accessToken']

  if (!token) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  jwt.verify(token, env.JWT_SECRET, (error, payload) => {
    if (error) {
      return reply.status(400).send({ error: error.message })
    }

    request.headers.userId = payload?.sub?.toString() as string

    done()
  })
}
