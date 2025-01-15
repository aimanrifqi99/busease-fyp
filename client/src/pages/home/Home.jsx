import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";
import "./home.css";

const Home = () => {
  return (
    <div className="homeContainer">
      <Navbar />
      <Header/>
      <Footer/>
    </div>
  );
};

export default Home;
