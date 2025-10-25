import axios from "axios"
import { create } from "zustand"

export const adminDataStore = create((set, get) => ({
  dataCateg: [],
  dataFilial: [],
  dataDoctors: [],
  dataCategById: [],
  dataZapis: [],
  dataReviews: [],

  getDataCategory: async () => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/category`)
      set({ dataCateg: data })
    } catch (error) { console.error(error) }
  },

  getDataFilial: async () => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/filial`)
      set({ dataFilial: data })
    } catch (error) { console.error(error) }
  },

  // Исправленный метод для отзывов
  getDataReviews: async () => {
    try {
      const { data } = await axios.get(`https://cf6305f8832a1b76.mokky.dev/otziv`) // исправлен endpoint
      set({ dataReviews: data })
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
  },

  // Новые методы для категорий
  postCategory: async (obj) => {
    try {
      await axios.post(`https://cf6305f8832a1b76.mokky.dev/category`, obj)
      get().getDataCategory()
    } catch (error) { console.error(error) }
  },

  updateCategory: async (id, obj) => {
    try {
      await axios.patch(`https://cf6305f8832a1b76.mokky.dev/category/${id}`, obj)
      get().getDataCategory()
    } catch (error) { console.error(error) }
  },

  deleteCategory: async (id) => {
    try {
      await axios.delete(`https://cf6305f8832a1b76.mokky.dev/category/${id}`)
      get().getDataCategory()
    } catch (error) { console.error(error) }
  },

  // Методы для докторов
  postDoctor: async (obj) => {
    try {
      await axios.post(`https://cf6305f8832a1b76.mokky.dev/doctors`, obj)
      get().getDataDoctors()
    } catch (error) { console.error(error) }
  },

  updateDoctor: async (id, obj) => {
    try {
      await axios.patch(`https://cf6305f8832a1b76.mokky.dev/doctors/${id}`, obj)
      get().getDataDoctors()
    } catch (error) { console.error(error) }
  },

  deleteDoctor: async (id) => {
    try {
      await axios.delete(`https://cf6305f8832a1b76.mokky.dev/doctors/${id}`)
      get().getDataDoctors()
    } catch (error) { console.error(error) }
  },

  // Методы для филиалов
  postFilial: async (obj) => {
    try {
      await axios.post(`https://cf6305f8832a1b76.mokky.dev/filial`, obj)
      get().getDataFilial()
    } catch (error) { console.error(error) }
  },

  updateFilial: async (id, obj) => {
    try {
      await axios.patch(`https://cf6305f8832a1b76.mokky.dev/filial/${id}`, obj)
      get().getDataFilial()
    } catch (error) { console.error(error) }
  },

  deleteFilial: async (id) => {
    try {
      await axios.delete(`https://cf6305f8832a1b76.mokky.dev/filial/${id}`)
      get().getDataFilial()
    } catch (error) { console.error(error) }
  },

  // Новые методы для видео-отзывов
  postReview: async (obj) => {
    try {
      await axios.post(`https://cf6305f8832a1b76.mokky.dev/otziv`, obj)
      get().getDataReviews()
    } catch (error) { console.error(error) }
  },

  updateReview: async (id, obj) => {
    try {

      await axios.patch(`https://cf6305f8832a1b76.mokky.dev/otziv/${id}`, obj)
      get().getDataReviews()
    } catch (error) { console.error(error) }
  },

  deleteReview: async (id) => {
    try {
      await axios.delete(`https://cf6305f8832a1b76.mokky.dev/otziv/${id}`)
      get().getDataReviews()
    } catch (error) { console.error(error) }
  }

}))
