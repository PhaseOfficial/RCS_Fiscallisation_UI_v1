import { useState } from 'react';
import mysite from '../assets/weblogo.png';
import { GiHamburgerMenu } from "react-icons/gi";
import { Link } from 'react-router-dom';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="sticky top-0 w-full bg-navigation bg-opacity-40 text-primary py-4 px-6 backdrop-blur-md z-10">
            <div className="container mx-auto flex items-center justify-between">
                <h1 className="text-2xl font-bold"><img src={mysite} alt='logo' className="w-32 "/></h1>

                {/* Desktop Menu */}
                                <div className="hidden md:flex space-x-6">
                <Link to="/" className="hover:text-white">Home</Link>
                <Link to="/Store" className="hover:text-white">Shop</Link>
                <Link to="/Services" className="hover:text-white">Services</Link>
                <Link to="/About" className="hover:text-white">About</Link>
                <Link to="/Contact" className="hover:text-white">Contact</Link>
                <Link to="/Comingsoon" className="hover:text-white">Children STEM Books</Link>
                <Link to="/Games" className="hover:text-white">Games</Link>
                </div>
                {/* Mobile Menu Button */}
                <button
                    className="md:hidden flex items-center px-3 py-2 border rounded text-black border-red hover:text-gray-300"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {/* Icon for mobile menu (hamburger) */}
                    <GiHamburgerMenu />
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-navigation bg-opacity-60 text-primary mt-2 py-4 rounded-lg shadow-lg">
                    <a href="/" className="block px-4 py-2 hover:bg-white/70">Home</a>
                    <a href="https://www.redcupseries.co.zw/#Comingsoon" className="block px-4 py-2 hover:bg-white/70">Shop</a>
                    <a href="https://www.redcupseries.co.zw/#Services" className="block px-4 py-2 hover:bg-white/70">Services</a>
                    <a href="https://www.redcupseries.co.zw/#About" className="block px-4 py-2 hover:bg-white/70">About</a>
                    <a href="https://www.redcupseries.co.zw/#Contact" className="block px-4 py-2 hover:bg-white/70">Contact</a>
                    <a href="https://www.redcupseries.co.zw/#Comingsoon" className="block px-4 py-2 hover:bg-white/70">Children STEM Books</a>
                    <Link to="/Games" className="block px-4 py-2 hover:bg-white/70">Games</Link>
                </div>
            )}
        </nav>
    );
}
