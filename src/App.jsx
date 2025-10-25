
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import Layout from './layout';
import TableComponent from './Table1';
import Categori from './pages/categori';
import Filial from './pages/filial';
import Otziv from './pages/otziv';
import Users from './pages/users';
import Doctors from './pages/doctors';


const App = () => {

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Layout />}>
          <Route index element={<Users />} />

          <Route path='doctors' element={<Doctors />} />
          <Route path='categoriy' element={<Categori />} />
          <Route path='filial' element={<Filial />} />
          <Route path='otziv' element={<Otziv />} />
        </Route>
      </>
    )
  )

  return (
    <div>

      <RouterProvider router={router} />
    </div>
  )
}

export default App
