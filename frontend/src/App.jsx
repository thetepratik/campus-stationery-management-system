import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth pages
import AdminLogin from './pages/auth/AdminLogin';
import StudentLogin from './pages/auth/StudentLogin';
import StudentRegister from './pages/auth/StudentRegister';
import StudentVerifyOtp from './pages/auth/StudentVerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin
import AdminLayout from './components/admin/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ComingSoon from './pages/admin/ComingSoon';
import Products from './pages/admin/Products';
import Inventory from './pages/admin/Inventory';
import OfflineSales from './pages/admin/OfflineSales';
import SalesHistory from './pages/admin/SalesHistory';
import OnlineOrders from './pages/admin/OnlineOrders';
import Reports from './pages/admin/Reports';
import AdminCustomers from './pages/admin/Customers';
import AdminCustomerDetails from './pages/admin/CustomerDetails';
import AdminSettings from './pages/admin/Settings';

// Student storefront
import UserLayout from './components/user/layout/UserLayout';
import Home from './pages/user/Home';
import ProductListing from './pages/user/ProductListing';
import ProductDetails from './pages/user/ProductDetails';
import Wishlist from './pages/user/Wishlist';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import OrderConfirmation from './pages/user/OrderConfirmation';
import MyOrders from './pages/user/MyOrders';
import Profile from './pages/user/Profile';
import AdminNotifications from './pages/admin/Notifications';
import StudentNotifications from './pages/user/Notifications';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WishlistProvider>
          <CartProvider>
            <NotificationProvider>

            <Routes>

              {/* =========================
                  STUDENT AUTH
              ========================== */}

              <Route
                path="/login"
                element={<StudentLogin />}
              />

              <Route
                path="/register"
                element={<StudentRegister />}
              />

              <Route
                path="/verify-otp"
                element={<StudentVerifyOtp />}
              />

              <Route
                path="/forgot-password"
                element={<ForgotPassword />}
              />

              <Route
                path="/reset-password/:token"
                element={<ResetPassword />}
              />


              {/* =========================
                  ADMIN AUTH
              ========================== */}

              <Route
                path="/admin/login"
                element={<AdminLogin />}
              />

              <Route
                path="/admin/forgot-password"
                element={<ForgotPassword role="admin" />}
              />

              <Route
                path="/admin/reset-password/:token"
                element={<ResetPassword role="admin" />}
              />


              {/* =========================
                  PROTECTED STUDENT AREA
              ========================== */}

              <Route element={<ProtectedRoute role="student" />}>

                <Route element={<UserLayout />}>

                  {/* Home */}
                  <Route
                    path="/"
                    element={<Home />}
                  />

                  {/* Products */}
                  <Route
                    path="/products"
                    element={<ProductListing />}
                  />

                  <Route
                    path="/products/:id"
                    element={<ProductDetails />}
                  />

                  {/* Wishlist */}
                  <Route
                    path="/wishlist"
                    element={<Wishlist />}
                  />

                  {/* Cart */}
                  <Route
                    path="/cart"
                    element={<Cart />}
                  />

                  {/* Checkout */}
                  <Route
                    path="/checkout"
                    element={<Checkout />}
                  />

                  {/* Order Confirmation */}
                  <Route
                    path="/order-confirmation/:id"
                    element={<OrderConfirmation />}
                  />

                  {/* Orders */}
                  <Route
                    path="/my-orders"
                    element={<MyOrders />}
                  />

                  {/* =========================
                      STUDENT PROFILE
                  ========================== */}
                  <Route
                    path="/profile"
                    element={<Profile />}
                  />

                  {/* =========================
                      STUDENT NOTIFICATIONS
                  ========================== */}
                  <Route
                    path="/notifications"
                    element={<StudentNotifications />}
                  />

                </Route>

              </Route>


              {/* =========================
                  PROTECTED ADMIN AREA
              ========================== */}

              <Route element={<ProtectedRoute role="admin" />}>

                <Route element={<AdminLayout />}>

                  {/* Dashboard */}
                  <Route
                    path="/admin/dashboard"
                    element={<Dashboard />}
                  />

                  {/* Products */}
                  <Route
                    path="/admin/products"
                    element={<Products />}
                  />

                  {/* Inventory */}
                  <Route
                    path="/admin/inventory"
                    element={<Inventory />}
                  />

                  {/* Offline Sales */}
                  <Route
                    path="/admin/offline-sales"
                    element={<OfflineSales />}
                  />

                  {/* Online Orders */}
                  <Route
                    path="/admin/online-orders"
                    element={<OnlineOrders />}
                  />

                  {/* Sales History */}
                  <Route
                    path="/admin/sales-history"
                    element={<SalesHistory />}
                  />

                  {/* Reports */}
                  <Route
                    path="/admin/reports"
                    element={<Reports />}
                  />
                  <Route
                    path="/admin/reports/sales"
                    element={<Reports />}
                  />

                  {/* Customers */}
                  <Route
                    path="/admin/customers"
                    element={<AdminCustomers />}
                  />
                  <Route
                    path="/admin/customers/:id"
                    element={<AdminCustomerDetails />}
                  />

                  {/* Notifications */}
                  <Route
                    path="/admin/notifications"
                    element={<AdminNotifications />}
                  />

                  {/* Settings */}
                  <Route
                    path="/admin/settings"
                    element={<AdminSettings />}
                  />

                </Route>

              </Route>


              {/* =========================
                  FALLBACK
              ========================== */}

              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

            </Routes>

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />

            </NotificationProvider>
          </CartProvider>
        </WishlistProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;