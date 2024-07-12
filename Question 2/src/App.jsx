import Hero from './components/Hero'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Hero/>,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
