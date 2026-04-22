import "./App.css";
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import FooterInfoBanner from "./components/FooterInfoBanner";
import Header from "./components/Header";
import TopBar from "./components/TopBar";
import WhatsAppChat from "./components/WhatsAppChat";
import PhoneRequiredModal from "./components/PhoneRequiredModal";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <PhoneRequiredModal />
        <TopBar />
        <Header />
        <Navbar />
        <main className="grow">
          <Outlet />
        </main>
        <FooterInfoBanner />
      </main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
}

export default App;
