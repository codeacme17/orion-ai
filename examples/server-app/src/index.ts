import express, { Router } from 'express'
import { createAgent } from './orion'

const router = Router()

router.get('/test', (req, res) => {
  res.send('Hello World')
})

router.get('/agent', async (req, res) => {
  const agent = await createAgent()
  const result = await agent.invoke([{ role: 'user', content: 'hi' }])
  res.json(result)
})

const app = express()

app.use(router)

app.listen(7183, () => {
  console.log('Server is running on port 7183')
})
