// filepath: /e:/RCSLandings/landing_pages/src/components/useCatalog.js
import { useState, useEffect } from "react";
import axios from "axios";

const useCatalog = () => {
  const [products, setProducts] = useState([]);
  const ACCESS_TOKEN = "EAAHTOCVbIk8BOzEFW4ULLn10FJjNFZBZA3VpLUZCkWiI7b9CA2UuJItlcRA1X3qgPtwHfc9x6Mee6hZB6W16L3uBeN9hyshB1cg13Y6qCXvFt5YtSww8QmEPK0FRWq5sV8UoKxePR7oxBlow1S2UIwZAKD3fTWShAN6SMl4923jET27GGge6eLc4l7iL9ZBF7H6S6CpNeHh0IiliL0eAvXtRM9SpIZD";
  const CATALOG_ID = "YOUR_CATALOG_ID"; // Replace with your actual catalog ID

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await axios.get(
          `https://graph.facebook.com/v19.0/${CATALOG_ID}/products?access_token=${ACCESS_TOKEN}`
        );
        setProducts(response.data.data);
      } catch (error) {
        console.error("Error fetching catalog:", error);
      }
    };

    fetchCatalog();
  }, []);

  return products;
};

export default useCatalog;