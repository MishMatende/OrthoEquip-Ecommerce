import { Outlet } from "react-router-dom";
import BarmOrthoBackground from "../assets/BarmOrthoBackground.webp";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";

function AuthLayout() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: `url(${BarmOrthoBackground})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      {/* Header section — logo + company name */}
      <header className="relative z-10 flex flex-col items-center mb-10 mt-6 md:mt-10">
        <img
          src={BalmOrthoLogo}
          alt="Balm Ortho Medical Supplies Logo"
          className="h-20 w-auto mb-3 drop-shadow-md"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-[#4eb0e3] text-center drop-shadow-sm">
          Balm Ortho Medical Supplies
        </h1>
      </header>

      {/* Auth content (Sign In / Sign Up) */}
      <main className="relative z-10 flex flex-col items-center justify-center w-full">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
