import { useEffect, useState } from "react";
import { supabase } from '../lib/supabaseClient';
import CanvasThumbnail from './CanvasThumbnail';

const Gameslist = () => {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [filteredGames, setFilteredGames] = useState([]); // Filtered game list

  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase.from("gamelinks").select("*");
      if (error) {
        console.error("Error fetching games:", error);
      } else {
        console.log("Fetched games:", data);
        setGames(data);
        setFilteredGames(data); // Initialize filtered list
      }
    };
    fetchGames();
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    // Filter games based on search term
    const filtered = games.filter((game) =>
      game.name.toLowerCase().includes(value)
    );
    setFilteredGames(filtered);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search games..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-1/2 p-2 mb-4 border border-gray-300 rounded"
      />

      {/* Game List */}
      <div className="flex justify-center items-center min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {filteredGames.length === 0 ? (
          <p>No games found</p>
        ) : (
          filteredGames.map((game) => (
            <div key={game.id} className="game-card">
              <a href={game.url} target="_blank" rel="noopener noreferrer">
                <CanvasThumbnail gameName={game.name} />
              </a>
              <p className="text-center mt-2">{game.name}</p>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};

export default Gameslist;
