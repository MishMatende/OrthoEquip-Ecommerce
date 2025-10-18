import "./App.css";
import Home from "./components/pages/Home";
import Navbar from "./components/Navbar";
import Preloader from "./components/Preloader";
import { useEffect, useState } from "react";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500); // simulate loading delay
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Preloader />;
  return (
    <>
      <Home />
    </>
  );
}

export default App;
