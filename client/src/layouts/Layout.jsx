import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col gap-md bg-primary-black text-primary-white">
      <Navbar />
      <div className="container flex-grow flex flex-col z-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
