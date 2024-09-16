import { Schema, model } from 'mongoose'

const users = new Schema({
  user_id: {type: String},
  movies: [{
    time: {type: String, default: Date.now, required: true},
    name: {type: String},
    url: {type: String},
    image: {type: String}
  }]
})

export default model('save', users)