import fastify from 'fastify'
import { userRoutes } from './routes/users'
import { authRoutes } from './routes/auth'

export const app = fastify()

app.register(authRoutes, {
  prefix: 'auth',
})

app.register(userRoutes, {
  prefix: 'users',
})
