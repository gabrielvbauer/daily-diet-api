import { FastifyInstance } from 'fastify'
import { checkIfUserIsAuthenticated } from '../hooks/check-if-user-is-authenticated'

export async function mealRoutes(app: FastifyInstance) {
  app.addHook('preHandler', (request, reply, done) => {
    checkIfUserIsAuthenticated(request, reply, done)
  })

  app.get('/', async (request) => {
    console.log(request)
  })
}
