import app from './app'
import { ENV } from './env-validate'

const port = ENV.PORT || 3000

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
