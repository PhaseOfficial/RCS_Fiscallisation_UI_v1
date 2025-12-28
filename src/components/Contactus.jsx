// filepath: /e:/RCSLandings/landing_pages/src/components/Contactus.jsx
import React, { useState } from 'react';
import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { IoMdPin } from "react-icons/io";
import { supabase } from '../lib/supabaseClient';

const Contactus = () => {
  const [contactInfo, setContactInfo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation for email or phone number
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!emailRegex.test(contactInfo) && !phoneRegex.test(contactInfo)) {
      setError('Please enter a valid email address or phone number with country code eg. +263 788 1472 89.');
      return;
    }

    const { data, error } = await supabase
      .from('contact')
      .insert([{ contact_info: contactInfo }]);

    if (error) {
      console.error('Error submitting form:', error.message);
      setError('Error submitting form: ' + error.message);
    } else {
      console.log('Form submitted successfully:', data);
      setSuccess('Form submitted successfully!');
      setContactInfo(''); // Clear the input field
    }
  };

  return (
    <div className="bg-background text-primary-foreground py-12 px-4 sm:px-6 lg:px-8" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 mt-10 text-gray-600">Get in Touch</h2>
            <p className="text-lg mb-4 text-gray-600">Feel free to reach out to us for any inquiries or collaborations.</p>
            <ul className="mb-6">
              <li className="flex items-center mb-2 text-gray-600">
                <FaPhone className="mr-2" />
                <a href="tel:+263788147289" className="hover:underline">
                  +263 788 1472 89
                </a>
              </li>
              <li className="flex items-center mb-2 text-gray-600">
                <MdEmail className="mr-2" />
                <a href="mailto:redcupseriespvtltd@gmail.com" className="hover:underline">
                  redcupseriespvtltd@gmail.com
                </a>
              </li>
              <li className="flex items-center text-gray-600">
                <IoMdPin className="mr-2" />
                <span>No. 6791 New Ceney Park Harare</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4 text-gray-600">Let us get in Touch with you</h2>
            <p className="text-lg mb-4 text-gray-600">Stay updated with our latest products and services.</p>
            <form className="flex items-center" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Phone Number or Your Email Address"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full bg-input text-primary-foreground placeholder-primary-foreground border border-primary rounded-l-md px-4 py-2 focus:outline-none"
                required
              />
              <button type="submit" className="bg-primary text-primary-foreground rounded-r-md px-4 py-2 ml-2">
                Connect
              </button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {success && <p className="text-green-500 mt-4">{success}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contactus;