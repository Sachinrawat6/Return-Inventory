import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <>
    <nav className="bg-white  hidden sm:block">
      <div className="container mx-auto px-4">
        <div className="flex justify-center h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-800"><span className="bg-[#222] rounded text-[#f1f1f1] py-1 px-4 ">Return</span> Inventory System</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
               <NavLink
                to="/stock"
                className={({ isActive }) => 
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive 
                      ? "border-black text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                Stocks
              </NavLink>
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive 
                      ? "border-black text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                Scan
              </NavLink>
              <NavLink
                to="/return-table-records"
                className={({ isActive }) => 
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive 
                      ? "border-black text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                Return Table Records
              </NavLink>
              <NavLink
                to="/press-table-records"
                className={({ isActive }) => 
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive 
                      ? "border-black text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                Press Table Records
              </NavLink>
              

               <NavLink
                to="/shipped-records"
                className={({ isActive }) => 
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive 
                      ? "border-black text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                Shipped Records
              </NavLink>
               <NavLink
                to="/inventory-records"
                className={({ isActive }) => 
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive 
                      ? "border-black text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                Inventory Records
              </NavLink>
               
            </div>
          </div>
        </div>
      </div>
    </nav>
    <hr className="container mx-auto mt-2 text-gray-200" />
    </>
  );
};

export default Navbar;