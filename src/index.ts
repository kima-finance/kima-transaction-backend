import ENV from './core/env'
import app from './app'

const port = ENV.PORT || 3000

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
