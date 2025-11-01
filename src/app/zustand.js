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
    const response = await fetch('http://localhost:5000/categories');
    const data = await response.json();
    set({ dataCateg: data });
  },

  postCategory: async (categoryData) => {
    const response = await fetch('http://localhost:5000/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    const newCategory = await response.json();
    set(state => ({ dataCateg: [...state.dataCateg, newCategory] }));
  },

  updateCategory: async (id, categoryData) => {
    const numericId = Number(id);
    const response = await fetch(`http://localhost:5000/categories/${numericId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      throw new Error('Failed to update category');
    }

    const updatedCategory = await response.json();
    set(state => ({
      dataCateg: state.dataCateg.map(category =>
        category.id === numericId ? updatedCategory : category
      )
    }));
  },

  deleteCategory: async (id) => {
    const numericId = Number(id);
    await fetch(`http://localhost:5000/categories/${numericId}`, {
      method: 'DELETE'
    });
    set(state => ({
      dataCateg: state.dataCateg.filter(category => category.id !== numericId)
    }));
  },

  // В вашем Zustand store добавьте:
  getDataFilial: async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/filials`)
      set({ dataFilial: data })
    } catch (error) { console.error(error) }
  },

  getDataFilialById: async (id) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/filials/${id}`)
      set({ dataFilialById: data })
    } catch (error) { console.error(error) }
  },

  postFilial: async (obj) => {
    try {
      await axios.post(`http://localhost:5000/filials`, obj)
      get().getDataFilial()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateFilial: async (id, obj) => {
    try {
      await axios.patch(`http://localhost:5000/filials/${id}`, obj)
      get().getDataFilial()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteFilial: async (id) => {
    try {
      await axios.delete(`http://localhost:5000/filials/${id}`)
      get().getDataFilial()
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  // Исправленный метод для отзывов
  getDataReviews: async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/reviews`) // исправлен endpoint
      set({ dataReviews: data })
    } catch (error) { console.error(error) }
  },


  getDataDoctors: async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/doctors`)
      set({ dataDoctors: data })
    } catch (error) { console.error(error) }
  },

  postDoctor: async (obj) => {
    try {
      await axios.post(`http://localhost:5000/doctors`, obj)
      get().getDataDoctors()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateDoctor: async (id, obj) => {
    try {
      await axios.patch(`http://localhost:5000/doctors/${id}`, obj)
      get().getDataDoctors()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteDoctor: async (id) => {
    try {
      await axios.delete(`http://localhost:5000/doctors/${id}`)
      get().getDataDoctors()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getZapis: async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/zapisi`)
      set({ dataZapis: data })
    } catch (error) { console.error(error) }
  },

  postZapis: async (obj) => {
    try {
      await axios.post(`http://localhost:5000/zapisi`, obj)
      get().getZapis()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteZapis: async (id) => {
    try {
      await axios.delete(`http://localhost:5000/zapisi/${id}`)
      get().getZapis()
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // Новые методы для категорий

  // Методы для докторов


  // Методы для филиалов


  postReview: async (fd) => {
    try {
      await axios.post("http://localhost:5000/reviews", fd);
      get().getDataReviews()
    } catch (err) {
      console.error("Ошибка postReview:", err.response?.data || err.message);
      throw err;
    }
  },


  // В функции updateReview убедитесь, что ID передается как число
  updateReview: async (id, reviewData) => {
    const numericId = Number(id);
    const response = await fetch(`http://localhost:5000/reviews/${numericId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      throw new Error('Failed to update review');
    }

    const updatedReview = await response.json();
    set(state => ({
      dataReviews: state.dataReviews.map(review =>
        review.id === numericId ? updatedReview : review
      )
    }));

  },

  deleteReview: async (id) => {
    try {
      await axios.delete(`http://localhost:5000/reviews/${id}`)
      get().getDataReviews()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

}))
