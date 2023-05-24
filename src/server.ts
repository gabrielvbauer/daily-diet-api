import { app } from './app'

app
  .listen({
    port: 3333,
  })
  .then((url) => {
    console.log(`HTTP Server running on ${url}`)
  })
