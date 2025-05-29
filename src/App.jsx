import React from 'react'
import Scanner from './components/Scanner'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReturnTableRecords from './components/ReturnTableRecords'
import PressTableRecords from './components/PressTableRecords'
import Navbar from './components/Navbar'

const App = () => {
  return (
   <BrowserRouter>
   <Navbar/>
   <Routes>
    <Route path='/' element={<Scanner/>}/>
    <Route path='/return-table-records' element={<ReturnTableRecords/>}/>
    <Route path='/press-table-records' element={<PressTableRecords/>}/>
   </Routes>
   </BrowserRouter>
  )
}

export default App