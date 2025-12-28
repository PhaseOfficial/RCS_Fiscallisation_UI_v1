import { useState, useEffect } from 'react';
import d1 from '../assets/d1.png';
import d2 from '../assets/d2.png';
import d3 from '../assets/d3.png';
import d4 from '../assets/d4.png';
import d5 from '../assets/d5.png';
import d6 from '../assets/d6.png';
import d7 from '../assets/d7.png';
import d8 from '../assets/d8.png';
import d26 from '../assets/d26.png';
import d27 from '../assets/d27.png';
import weblogo from '../assets/d10.png';

export default function HeroSection() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Array of imported images for the slideshow
    const images = [d1, d2, d3, d4, d5, d6, d7,d8, d26, d27];

    // Automatically update current image index every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval); // Clear interval on unmount
    }, [images.length]);

    return (
        <section className="relative flex flex-col ma md:flex-row items-center mb-20 justify-center min-h-screen-0 bg-background text-primary pb-12 ">
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8">
  <h1 className="mb-4 flex justify-center">
    <img src={weblogo} alt="logo" className="logo-home " />
  </h1>
  <div>
    <p className="text-2xl sm:text-3xl md:text-4xl mb-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-black to-purple-600 font-montserrat typewriter-text text-center">
      Where Quality is Priority
    </p>
  </div>
  <div className="flex justify-center">
    <a
      href="#"
      className="bg-primary text-primary-foreground hover:bg-primary/80 py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300"
    >
      Shop Now
    </a>
  </div>
</div>


          

            {/* Slideshow images */}
            <div className="relative w-full h-64 md:w-1/2">
                {images.map((src, index) => (
                    <img
                        key={index}
                        src={src}
                        alt={`Slide ${index + 1}`}
                        className={`absolute top-0 left-0  pb-8 object-cover transition-opacity duration-500 ${
                currentImageIndex === index ? 'opacity-100' : 'opacity-0'
            }`}
                    />
                ))}
            </div>
        </section>
    );
}
