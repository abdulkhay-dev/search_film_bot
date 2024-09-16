import { Schema, model } from 'mongoose'

const users = new Schema({
  _id: {type: String},
  first_name: {type: String},
  last_name: {type: String},
  created: {type: String, default: Date.now, required: true}
})

export default model('users', users)