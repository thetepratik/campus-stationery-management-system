import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

const UserLayout = () => {
  return (
    <div className="user-layout">
      <Navbar />
      <main className="user-layout__content">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default UserLayout;
