import axios from "axios"

export async function fetch_search(search) {
  try {
    const { data } = await axios.get(`https://rezka.ag/search/?do=search&subaction=search&q=${search}`)
    return {error: false, result: data}
  } catch (error) {
    return {error: true, message: error.message}
  }
}