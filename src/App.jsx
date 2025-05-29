import React from 'react'
import Scanner from './components/Scanner'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReturnTableRecords from './components/ReturnTableRecords'
import PressTableRecords from './components/PressTableRecords'

const App = () => {
  return (
   <BrowserRouter>
   <Routes>
    <Route path='/' element={<Scanner/>}/>
    <Route path='/return-table-record' element={<ReturnTableRecords/>}/>
    <Route path='/press-table-record' element={<PressTableRecords/>}/>
   </Routes>
   </BrowserRouter>
  )
}

export default App