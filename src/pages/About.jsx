import React from 'react'
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import { motion } from 'framer-motion';
import Contactus from '../components/Contactus';
import PAmhonde from '../assets/pamhonde.png';
import Cvutete from '../assets/cvutete.png';
import Cchadiwa from '../assets/cchadiwa.png';
import gowani from '../assets/gowani.jpg'
import { FaLinkedin } from "react-icons/fa";
import backgroundImage from '../assets/background.png'; 


const About = () => {
  return (
<div> <div>
    <Navbar />
    <div>
    <div className="bg-cover bg-center h-screen text-gray-800" >
      {/* Hero Section */}
      <section className="flex items-center text-gray-800 bg-cover relative flex-col md:pt-20 md:p-12 md:pb-20 sd:p-8"
  style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="container mx-auto text-center">
          <h1 className="text-4xl text-5xl font-bold">About Us</h1>
          <p className="mt-4 text-lg md:text-xl">
            We believe 
          </p><p className="text-4xl md:text-xl mb-4 font-black ">Mindset is Everything</p>
        </div>
        
      </section>

      {/* Company Description */}
      <section className="py-12">
      <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="text-black p-6 rounded-lg shadow-lg my-8"
    >
      <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <p className="text-lg leading-relaxed text-center md:text-left">
          At <span className="text-red-500">Red Cup Series</span>, a name derived from party solo cups to associate the brand with <span className="text-red-500">free and happy vibes</span> we believe technology is more than a tool—it's a <span className="text-red-500">lifestyle</span>. Founded with a vision to improve livelihoods, we combine <span className="text-red-500">cutting-edge innovation </span>with everyday essentials, creating a unique blend of <span className="text-red-500">technology and lifestyle products</span> that enrich lives and empower communities.

From stylish, <span className="text-red-500">high-quality clothing</span> like T-shirts to advanced <span className="text-red-500">technological devices</span>, we source and deliver only the best the market has to offer. But we don't stop there—we're passionate about <span className="text-red-500">collaboration</span>. By partnering with brands, we help them bring their ideas to life through <span className="text-red-500">creative design, development, and tailored solutions</span>.

Our expertise spans multiple disciplines, including app development, AI and data science solutions, website creation, and graphic design. Over the years, we've launched software applications that address daily challenges, making life simpler and more efficient for our customers.

<span className="text-red-500">Innovation, quality, and collaboration are at the heart of everything we do</span>. Whether it's designing a new app, crafting a graphic masterpiece, or curating products that enhance your lifestyle, we are dedicated to creating solutions that make a difference.

Join us on this journey as we continue to shape a world where technology and lifestyle meet seamlessly. Together, let's build a brighter future. <span className="text-yellow-500">Mindset is Everything.</span>
          </p>
          <h2 className="text-3xl font-bold text-center mb-8 mt-8">Our Mission</h2>
          <p className="text-lg leading-relaxed text-center md:text-left">
          To enhance livelihoods by delivering innovative, high-quality technology and lifestyle solutions that empower individuals and businesses to thrive in a rapidly evolving world
          </p>
          <h2 className="text-3xl font-bold text-center mb-8 mt-8">Our Vision</h2>
          <p className="text-lg leading-relaxed text-center md:text-left">
          To become a global leader in seamlessly integrating technology and lifestyle, fostering creativity, collaboration, and sustainable growth for communities and brands alike.</p>
        </div>
    </motion.div>
      </section>

      {/* Team Section */}
<section className="py-12 bg-gray-100">
  <div className="container mx-auto px-6 md:px-12">
    <h2 className="text-3xl font-bold text-center mb-8">Meet the Team</h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Team Member 1 */}
      <div className="text-center">
        <img
          src={PAmhonde}
          alt="Team Member"
          className="mx-auto rounded-full h-32 mb-4"
        />
        <h3 className="text-xl font-bold">Arthur Mhonde</h3>
        <p className="text-gray-600">CEO</p>
        <a
          href="https://www.linkedin.com/in/panashe-arthur-mhonde-2917b6261/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
      {/* Team Member 2 */}
      <div className="text-center">
        <img
          src={Cvutete}
          alt="Team Member"
          className="mx-auto rounded-full h-32 mb-4"
        />
        <h3 className="text-xl font-bold">Christopher Vutete</h3>
        <p className="text-gray-600">Managing Director</p>
        <a
          href="https://www.linkedin.com/in/christopher-vutete-603b8166/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
      {/* Team Member 3 */}
      <div className="text-center">
        <img
          src={Cchadiwa}
          alt="Team Member"
          className="mx-auto rounded-full h-32 mb-4"
        />
        <h3 className="text-xl font-bold">Craig Chadiwa</h3>
        <p className="text-gray-600">CTO</p>
        <a
          href="https://www.linkedin.com/in/craig-chadiwa-16485724a/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
       {/* Team Member 3 */}
       <div className="text-center">
        <img
          src={gowani}
          alt="Team Member"
          className="mx-auto rounded-full h-32 mb-4"
        />
        <h3 className="text-xl font-bold">Gamuchirai Gowani</h3>
        <p className="text-gray-600">Head of Marketing</p>
        <a
          href="https://www.linkedin.com/in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
    </div>
  </div>
</section>
      <Contactus className="mt-20"/>
   <Footer className="mb-10"/>
    </div>
    </div>
    
    </div>

    </div>
   
    
  )
}
export default About;