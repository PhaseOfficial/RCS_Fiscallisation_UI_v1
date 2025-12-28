import React from 'react'
import { BiSolidTShirt } from "react-icons/bi";
import { MdDesignServices } from "react-icons/md";
import { FaBrain } from "react-icons/fa";
import { FaDesktop } from "react-icons/fa6";
import { FaCartShopping } from "react-icons/fa6";
import { GiRollingDiceCup } from "react-icons/gi";
import { FcCollaboration } from "react-icons/fc";
import { LiaPeopleCarrySolid } from "react-icons/lia";
import BeholdWidget from './BeholdWidget';


const Exploreprod = () => {
  return (
    
    <div className="relative flex flex-col bg-background mt-20 md:pt-20 md:p-12 md:pb-20 sd:p-8">
    
    <h1 className="text-red-800 text-2xl font-bold mb-10 mt-20">Explore Our Main Products and Services</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="flex flex-col items-center">
      <BiSolidTShirt className='text-5xl'/>
        <span className="mt-2 text-muted-foreground">Quality Clothes</span>
      </div>
      <div className="flex flex-col items-center">
      <MdDesignServices className='text-5xl'/>
        <span className="mt-2 text-muted-foreground">Graphic Designs</span>
      </div>
      <div className="flex flex-col items-center">
      <FaBrain className='text-5xl'/>
        <span className="mt-2 text-muted-foreground">AI Solutions</span>
      </div>
      <div className="flex flex-col items-center">
      <FaDesktop className='text-5xl'/>
        <span className="mt-2 text-muted-foreground">Software Development</span>
      </div>
      
    </div>
    <hr className="border-t-2 border-black my-6 mt-10" />
    <BeholdWidget />
    <h2 className="text-red-800 font-bold mb-4 text-2xl mt-20">Explore More</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col items-center transform transition-transform duration-300 hover:scale-105">
            <FaCartShopping className='text-9xl '/>
        <div className="p-4">
          <h3 className="text-lg font-semibold">Red Cup Series Merchandise</h3>
          <p className="text-muted-foreground">
            Explore all the Quality products meticulously selected with Quality in mind.
          </p>
          <a
            href="#"
            className="mt-2 inline-block bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded text-green-600"
          >
            Shop Now
          </a>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col items-center transform transition-transform duration-300 hover:scale-105">
      <GiRollingDiceCup  className='text-9xl '/>

        <div className="p-4">
          <h3 className="text-lg font-semibold">Red Cup Series Lists</h3>
          <p className="text-muted-foreground">
            View Listings from other selected brands and individuals offering Quality products and services.
          </p>
          <a
            href="#"
            className="mt-2 text-green-600 inline-block bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded"
          >
            View Listings
          </a>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col items-center transform transition-transform duration-300 hover:scale-105">
      <LiaPeopleCarrySolid className='text-9xl '/>
        <div className="p-4">
          <h3 className="text-lg font-semibold">Collaborate With Us</h3>
          <p className="text-muted-foreground">
            If you want quality and need a realiable partner and supplier
          </p>
          <a
            href="#"
            className="mt-2 text-green-600 inline-block bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded"
          >
            Collaborate with us.
          </a>
        </div>
      </div>
    </div>
  </div>
  )
}

export default Exploreprod