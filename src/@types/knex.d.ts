// eslint-disable-next-line
import { knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      username: string
      password: string
      avatar_url?: string
    }

    meals: {
      id: string
      name: string
      description: string
      created_at: string
      in_diet: boolean
      user_id: string
    }
  }
}
