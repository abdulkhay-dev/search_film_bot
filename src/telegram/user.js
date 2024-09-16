import Users from '../models/users.model.js'
import History from '../models/history.model.js'
import Save from '../models/save.model.js'

export class User {
  async findUser(chat) {
    return await Users.findOne({_id: chat.id}).lean()
  }
  async createUser(chat) {
    const user = new Users({
      _id: chat.id,
      first_name: chat.first_name,
      last_name: chat.last_name,
    })
    await user.save()
    const newHistory = new History({
      user_id: chat.id
    })
    await newHistory.save()
    const newSave = new Save({
      user_id: chat.id
    })
    await newSave.save()
  }
  async getHistory(chat, name) {
    const history = await History.findOne({user_id: chat.id})
    if (history) {
      return history.movies.find(e => e.name == name)
    } else return false
  }
  async addHistory(chat, movie) {
    const history = await History.findOne({user_id: chat.id})
    if (history) {
      history.movies.push({
        name: movie.name,
        url: movie.url,
        image: movie.image
      })
      await history.save()
    }
  }
  async addSave(chat, movie) {
    const s = await Save.findOne({user_id: chat.id})
    if (s.user_id) {
      s.movies.push({
        name: movie.name,
        url: movie.url,
        image: movie.image
      })
      await s.save()
    }
  }
  async getSave(chat) {
    return await Save.findOne({user_id: chat.id}).lean()
  }
  async removeSave(chat, name) {
    const save = await Save.findOne({user_id: chat.id})
    save.movies = save.movies.filter(e => e.name != name)
    await save.save()
  }
}