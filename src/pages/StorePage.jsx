// filepath: /e:/RCSLandings/landing_pages/src/pages/StorePage.jsx
import React from "react";
import useCatalog from "../components/useCatalog";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

const StorePage = () => {
  const products = useCatalog();

  return (
    <>
      <Navbar />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {products && products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="border p-4 rounded-lg shadow">
              <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p>{product.description}</p>
              <p className="font-bold">${product.price}</p>
              <a
                href={`https://wa.me/YOUR_WHATSAPP_NUMBER?text=I'm%20interested%20in%20${product.name}`}
                className="bg-green-500 text-white px-4 py-2 rounded block text-center mt-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat to Buy
              </a>
            </div>
          ))
        ) : (
          <p>No products available</p>
        )}
      </div>
      <Footer />
    </>
  );
};

export default StorePage;