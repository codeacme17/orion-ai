import express, { Router } from 'express'

const router = Router()

router.get('/test', (req, res) => {
  res.send('Hello World')
})

const app = express()

app.use(router)

app.listen(7183, () => {
  console.log('Server is running on port 7183')
})
