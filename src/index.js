import express from 'express'
import { connect } from "mongoose"
import { Telegram } from './telegram/index.js'
import 'dotenv/config'

const app = express()

connect(process.env.MONGODB_URI)
  .then(() => {
    const telegram = new Telegram()
    telegram.init()
    app.listen(process.env.PORT || 8080, () => console.log('Server start'))
  })
  .catch((error) => console.log(error.message))