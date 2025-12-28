import React, { useState, useEffect } from 'react';
import { Ripple } from 'ldrs';

export const loaderpage = () => {
  return (
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Simulate a delay for loading (e.g., API call or page transition)
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
  
      return () => clearTimeout(timer);
    }, []);
  
    return (
      <div className="h-screen flex items-center justify-center">
        {loading ? (
          <div>
            <Ripple size={80} color="blue" />
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold">Page Content</h1>
            <p>The page has successfully loaded!</p>
          </div>
        )}
      </div>
  )
}
