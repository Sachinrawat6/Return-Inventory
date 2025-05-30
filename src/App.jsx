import React from 'react'
import Scanner from './components/Scanner'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ReturnTableRecords from './components/ReturnTableRecords'
import PressTableRecords from './components/PressTableRecords'
import Navbar from './components/Navbar'
import ShippedRecord from './components/ShippedRecord'
import QrScanner from './components/Scanner2'
import TestQr from './components/TestQr'

const App = () => {
  return (
   <BrowserRouter>
   <Navbar/>
   <Routes>
    <Route path='/' element={<Scanner/>}/>
    {/* <Route path='/' element={<TestQr/>}/> */}
    <Route path='/test2' element={<QrScanner/>}/>
    <Route path='/return-table-records' element={<ReturnTableRecords/>}/>
    <Route path='/press-table-records' element={<PressTableRecords/>}/>
    <Route path='/shipped-records' element={<ShippedRecord/>}/>
   </Routes>
   </BrowserRouter>
  )
}

export default App