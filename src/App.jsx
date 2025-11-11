import "./App.css";
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import FooterInfoBanner from "./components/FooterInfoBanner";
import Header from "./components/Header";
import { Toaster } from "./components/ui/sonner";
import TopBar from "./components/TopBar";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <TopBar />
      <Header />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <FooterInfoBanner />
      <Footer />
    </div>
  );
}

export default App;
