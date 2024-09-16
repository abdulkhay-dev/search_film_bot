import TelegramBot from "node-telegram-bot-api"
import * as cheerio from 'cheerio'

import message from "./message.js"
import {User} from "./user.js"
import { fetch_search } from "../utils/fetch.js"

export class Telegram extends User {

  constructor() {
    super()
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
      polling: true
    })
  }

  init() {
    this.bot.on('message', this.onMessage.bind(this))
    this.bot.on('inline_query', this.inlineQuery.bind(this))
    this.bot.on('callback_query', this.callbackQuery.bind(this))
  }

  async onMessage({text, chat}) {
    if (text == '/start') this.startCommand(text, chat)
    else if (text == '/featured') this.featuredList(chat)
    else {
      const user = await this.findUser(chat)
      if (!user) return this.bot.sendMessage(chat.id, message.start_bot)
      let res = false
      await this.fetchSearch(text, chat, async (error, name, image, url) => {
        if (error) this.bot.sendMessage(chat.id, message.error)
        else {
          res = true
          const save = await this.getSave(chat)
          if (save.movies.find(e => e.name == name)) {
            this.bot.sendPhoto(chat.id, image, this.movieOptionRemoveList(name, url))
          } else {
            this.bot.sendPhoto(chat.id, image, this.movieOptionAddList(name, url))
          }
        }
      })
      if (!res) return this.bot.sendMessage(chat.id, message.none)
    }
  }

  async inlineQuery({id, query, from}) {

    if (!query) {
      this.bot.answerInlineQuery(id, [
        {
          type: 'article',
          id: 1,
          title: message.type_name,
          input_message_content: {
            message_text: message.type_name
          }
        }
      ])
    }

    const searchResult = []

    await this.fetchSearch(query, from, (error, name, image, url, i) => {
      if (error) {
        searchResult.push({
          type: 'article',
          id: 1,
          title: message.error,
          input_message_content: {
            message_text: message.error
          }
        })
      } else {
        searchResult.push({
          type: 'article',
          id: i,
          url: url,
          title: name,
          thumbnail_url: image,
          thumbnail_width: 50,
          thumbnail_height: 80,
          input_message_content: {
            message_text: `[${name}](${url})`,
            parse_mode: 'Markdown'
          }
        })
      }
    })

    if (searchResult.length == 0) {
      searchResult.push({
        type: 'article',
        id: 1,
        title: message.none,
        input_message_content: {
          message_text: message.none
        }
      })
    }

    this.bot.answerInlineQuery(id, searchResult)

  }

  async callbackQuery(msg) {
    if (msg.data == 'save') {
      const movie = await this.getHistory(msg.message.chat, msg.message.caption)
      this.addSave(msg.message.chat, movie)
      this.bot.sendMessage(msg.message.chat.id, 'Добавлен')
    }
    if (msg.data == 'remove-save') {
      this.removeSave(msg.message.chat, msg.message.caption)
      this.bot.sendMessage(msg.message.chat.id, 'Удален из списка')
    }
  }

  async startCommand(text, chat) {
    const user = await this.findUser(chat)
    if (user) return this.bot.sendMessage(chat.id, message.movie_name)
    this.createUser(chat)
    return this.bot.sendMessage(chat.id, message.movie_name)
  }

  async fetchSearch(text, chat, callback) {
    const res = await fetch_search(text)
    if (res.error) return callback(true, null, null, null, null)
    if (res.result) {
      const $ = cheerio.load(res.result)
      $('.b-content__inline_item').each((i, e) => {
        let name = $(e).find('.b-content__inline_item-link a').text()
        if (name.toLocaleLowerCase().search(text.toLocaleLowerCase()) >= 0) {
          const image = $(e).find('.b-content__inline_item-cover img').attr('src')
          const url = $(e).find('.b-content__inline_item-cover a').attr('href')
          name = name.replace('[', ' ')
          name = name.replace(']', '')
          this.addHistory(chat, {name, image, url})
          callback(false, name, image, url, i)
        }
      })
    }
  }

  async featuredList(chat) {
    const save = await this.getSave(chat)
    if (save.movies.length == 0) {
      this.bot.sendMessage(chat.id,  'Список пустой')
    } else {
      save.movies.forEach(e => {
        this.bot.sendPhoto(chat.id, e.image, this.movieOptionRemoveList(e.name, e.url))
      })
    }
  }

  movieOptionAddList(name, url) {
    return {
      caption: `[${name}](${url})`,
      disable_web_page_preview: true,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Смотреть',
              url: url
            }
          ],
          [
            {
              text: 'Добавить в избранное',
              callback_data: 'save'
            }
          ]
        ]
      }
    }
  }

  movieOptionRemoveList(name, url) {
    return {
      caption: `[${name}](${url})`,
      disable_web_page_preview: true,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Смотреть',
              url: url
            }
          ],
          [
            {
              text: 'Удалить из списка',
              callback_data: 'remove-save'
            }
          ]
        ]
      }
    }
  }

}