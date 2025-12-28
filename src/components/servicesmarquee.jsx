import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Import images explicitly
import DevelopmentImage from '../assets/development.jpeg';
import AIandMLImage from '../assets/AIandML.jpeg';
import MobileAppImage from '../assets/development.jpeg';
import FashionGraphicDesignImage from '../assets/GRAPHdesign.png';
import GeneralGraphicsDesignImage from '../assets/graphicsDesign.png';
import DigitalMarketingImage from '../assets/digitalMarketing.jpeg';
import ProductFixAndSupplyImage from '../assets/product.jpeg';

// Define services array
const services = [
  { name: 'Website Development', image: DevelopmentImage },
  { name: 'AI, ML & Data Science Solutions', image: AIandMLImage },
  { name: 'Mobile App Development', image: MobileAppImage },
  { name: 'Fashion Graphic Design', image: FashionGraphicDesignImage },
  { name: 'General Graphics Design', image: GeneralGraphicsDesignImage },
  { name: 'Digital Marketing', image: DigitalMarketingImage },
  { name: 'Product Fix and Supply', image: ProductFixAndSupplyImage },
];
const ServicesMarquee = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMoving) {
        setCurrentIndex((currentIndex + 1) % services.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex, isMoving]);

  const handlePrev = () => {
    setIsMoving(true);
    setCurrentIndex((currentIndex - 1 + services.length) % services.length);
    setTimeout(() => setIsMoving(false), 300);
  };

  const handleNext = () => {
    setIsMoving(true);
    setCurrentIndex((currentIndex + 1) % services.length);
    setTimeout(() => setIsMoving(false), 300);
  };

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-between p-4 md:p-8 ">
     <FaArrowLeft
            className="text-2xl cursor-pointer mr-4 hover:text-blue-500"
            onClick={handlePrev}
          />
      {/* Left Section: Text */}
      <div className="flex flex-col items-start justify-center w-full md:w-1/2">
        <motion.div
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ duration: 1 }}
          className="flex items-center mb-4"
        >
         
          <h2 className="text-2xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-red-600 font-montserrat">
            {services[currentIndex].name}
          </h2>
          
        </motion.div>
        <p className="text-gray-600 text-lg md:text-xl">
          Explore our expert services in {services[currentIndex].name} to meet your business needs.
        </p>
      </div>

      {/* Right Section: Image */}
      <motion.img
        src={services[currentIndex].image}
        alt={services[currentIndex].name}
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full  sm:w-[200px] md:w-[300px] lg:w-[500px] h-auto  rounded-lg shadow-lg object-cover mt-6 md:mt-0"
      />
      <FaArrowRight className="text-2xl cursor-pointer mr-4 hover:text-blue-500" onClick={handleNext} />
    </div>
  );
};

export default ServicesMarquee;
