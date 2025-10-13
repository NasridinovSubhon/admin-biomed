import axios from "axios"
import { create } from "zustand"


export const adminDataStore = create((set, get) => ({
  dataCateg: [],
  dataDoctors: [],
  dataCategById: [],
  dataZapis: [],
  getDataCategory: async () => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/category`)
      set({ dataCateg: data })
    } catch (error) { console.error(error) }
  },

  getDataCategoryById: async (id) => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/category/${id}`)
      set({ dataCategById: data })
    } catch (error) { console.error(error) }
  },

  getDataDoctors: async () => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/doctors`)
      set({ dataDoctors: data })
    } catch (error) { console.error(error) }
  },
  getZapis: async () => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/zapis`)
      set({ dataZapis: data })
    } catch (error) { console.error(error) }
  },
  postZapis: async (obj) => {
    try {
      await axios.post(`https://cf6305f8832a1b76.mokky.dev/zapis`, obj)
      get().getZapis()
    } catch (error) { console.error(error) }
  },
  deleteZapis: async (id) => {
    try {
      await axios.delete(`https://cf6305f8832a1b76.mokky.dev/zapis/${id}`)
      get().getZapis()
    } catch (error) { console.error(error) }
  }

}))
