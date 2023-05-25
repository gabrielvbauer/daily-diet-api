import fastify from 'fastify'
import cookies from '@fastify/cookie'
import { userRoutes } from './routes/users'
import { authRoutes } from './routes/auth'
import { mealRoutes } from './routes/meals'

export const app = fastify()

app.register(cookies)

app.register(authRoutes, {
  prefix: 'auth',
})

app.register(userRoutes, {
  prefix: 'users',
})

app.register(mealRoutes, {
  prefix: 'meals',
})
