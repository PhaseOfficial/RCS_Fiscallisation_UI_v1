import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ComingSoon from "./pages/comingsoon";
import './App.css';
import ContactUs from "./pages/Contact";
import Games from "./pages/Games";
import TagManager from 'react-gtm-module';
import StorePage from "./pages/StorePage";
import AIChatWidget from "./components/AIChatWidget";

const tagManagerArgs = {
  gtmId: 'GTM-PKXK7LPV', // Replace with your GTM ID
};

TagManager.initialize(tagManagerArgs);


const App = () => {
  return (
    <div className="p-4">

      <Routes >
        <Route path="/" element={<Home />} />
        <Route path="/About" element={<About />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/Comingsoon" element={<ComingSoon />} />
        <Route path="/Contact" element={<ContactUs />} />
        <Route path="/Games" element={<Games />} />
        <Route path="/Store" element={<StorePage />} />
      </Routes>
        <AIChatWidget />
    </div>
  );
};

export default App;
