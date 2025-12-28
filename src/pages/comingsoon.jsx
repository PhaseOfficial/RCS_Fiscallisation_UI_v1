import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { Link } from 'react-router-dom';

const ComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-900">
    <Navbar />
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl font-bold mb-4">Coming Soon</h1>
        <p className="text-lg mb-8">We are working hard to bring something amazing to you. Stay tuned!</p>
        <img 
          src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExenhkd293Mmp6bTU5bnY0aDY2c3libTFiYjR5Mml1dDVxdTU3Y2VmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yJwXlLESRVkFd6yQVr/giphy.gif" 
          alt="Loading animation" 
          className="w-64 h-64 mx-auto mb-8"
        />
        <div className="flex justify-center space-x-4">
        <Link
        to="/games"
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
      >
        Play Games
      </Link>
          <a
            href="/"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
