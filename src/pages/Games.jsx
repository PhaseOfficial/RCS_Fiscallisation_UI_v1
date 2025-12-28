import Footer from "../components/footer";
import GameThumbnails from "../components/Gameslist";
import Navbar from "../components/Navbar";

function App() {
    return (
        <>
        <Navbar />
        <div>
            <h1 className="text-2xl font-bold text-center">Games</h1>
            <GameThumbnails />
        </div>
        <Footer />
        </>
    );
}

export default App;
