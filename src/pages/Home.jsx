import HeroSection from '../components/HeroSection';
import Navbar from '../components/Navbar';
import Explore from '../components/Exploreprod';
import '../App.css';
import Contactus from '../components/Contactus';
import Footer from '../components/footer';
import Companies from '../components/companies';
//import Testimonials from '../components/Testimonials';

export default function Home() {
    return (
        <div>
            <Navbar />
            
            <HeroSection className="mt-20"/>
            <Explore className="mt-20"/>
            <Companies className="mt-20"/>
            <Contactus className="mt-20" id="contact"/>
            <Footer className="mt-20"/>

        </div>

           
    );
}
