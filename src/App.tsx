
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import ProductList from "@/pages/ProductList";
import ProductViewStatic from "@/pages/ProductViewStatic";
import EditProductPreview from "@/pages/EditProductPreview";
import AddProductDemo from "@/pages/AddProductDemo";
import DynamicPagesDemo from "@/pages/DynamicPagesDemo";
import RouteMap from "@/pages/RouteMap";
import Employees from "@/pages/Employees";
import Inventory from "@/pages/Inventory";
import Franchise from "@/pages/Franchise";
import Customer from "@/pages/Customer";
import CategoryWiseSale from "./pages/CategoryWiseSale";
import StockVariation from "./pages/StockVariation";
import TestingPos from "./pages/TestingPos"
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { GstProvider } from "./components/contexts/gstContext";
import { LoginForm } from "@/components/auth/LoginForm";
// import { SignupForm } from "./components/auth/SignUpForm";
import { ForgotPasswordForm } from "./components/auth/ForgotPasswordForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OrderReport from "./pages/OrderReport";
import QrPayments from "./pages/QrPayments";
import PayLater from "./pages/PayLater";
import DiscountInvoices from "./pages/DiscountInvoices";
import TeleCallerList from "./pages/StaffManagemnet";
import TeleCallerStatus from "./pages/TeleCallerStatus";
import CrmReport from "./pages/CrmReport";
// NEW: SKU pages (place these files at src/pages/sku/ if not present)
import SkuList from "@/pages/SkuList";
import SkuMovement from "@/pages/SkuMovement";
import Sku from "@/pages/Sku";
import ExpenseSummary from "./pages/ExpenseSummary";
import CashWithdrawl from "./pages/CashWithdrawl";
import Billing from "./pages/Billing";
import RealTimeInventory from "./pages/RealTimeInventory";
import DailyInventory from "./pages/DailyInventory";
import SlocStock from "./pages/CommingSoon";
import Settlement from "./pages/Settlement";
import PreShortSupply from "./pages/PreShortSupply";
import SalesBanner from "./pages/SalesBanner";
import SocialMedia from "./pages/SocialMedia";
import Reports from "./pages/Reports";
import GstCacheReport from "./pages/GstCacheReport";
import NewVendor from "./pages/Categorycarosel";
import VendorList from "./pages/CustomerList";
import Profilepage from "./pages/ProfilePage";
import ShopSettings from "./pages/ShopSettings";
import CategoryManagement from "./pages/CategoryManagement";
import Disconts from "./pages/Discounts";
import RouteManagement from "./pages/RouteManagement";
import AssetsManagement from "./pages/AssetsManagement";
import ConsolidatedVehiclePay from "./pages/ConsolidatedVehiclePay";
import RentVehiclePaymentsList from "./pages/RentVehiclePaymentsList";
import FranchiseRequests from "./pages/FranchiseRequests";
import  TestProducts from "./pages/TestProducts";
import CommingSoon from "./pages/CommingSoon";
import Bannerspage from "./pages/Bannerspage"
import { VariantProvider } from "@/components/contexts/variantContext";
import TestPos from   "./pages/TestPos";
import PublicRoute from "@/components/auth/ProtectedRoute";
import { CategoriesProvider } from "@/components/contexts/categoriesContext";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
const queryClient = new QueryClient();

const App = () => (
     <Provider store={store}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <GstProvider>
          <CategoriesProvider>
            <VariantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            {/* <Route path="/signup" element={<SignupForm />} /> */}
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {/* <Products /> */}
                    <TestProducts/>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

             <Route
              path="/add-products"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {/* <Products /> */}
                    <AddProductDemo/>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

             <Route
              path="/dynamic-pages"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {/* <Products /> */}
                    <DynamicPagesDemo/>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchase-Details"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteMap />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Employees />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Inventory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/franchise"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Franchise />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Point-of-sale"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {/* <Customer /> */}
                     <TestPos/>
                     {/* <TestingPos/> */}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/category"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CategoryWiseSale />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/StockVariation"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <StockVariation />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/CommingSoon"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CommingSoon/>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sku/list"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SkuList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sku/vendor-Management"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SkuMovement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sku/Inventory-Management"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Sku />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/OrderReport"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OrderReport />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
              <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <QrPayments />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
              {/* ---------- PAY later routes (new) ---------- */}
              <Route
              path="/PayLater/Paylater"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayLater />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/PayLater/DiscountInvoices"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DiscountInvoices />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
                 {/* ---------- end PAY later routes  ---------- */}
    {/* ---------- TeleCaller routes (new) ---------- */}
            <Route
              path="/Staff-Management"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeleCallerList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Telecaller/TelecallerStatus"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeleCallerStatus />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Telecaller/CrmReport"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CrmReport />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* ---------- end TeleCaller routes ---------- */}
             <Route
              path="/Telecaller/CrmReport"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CrmReport />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

             <Route
              path="/ProductList"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProductList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

              <Route
              path="/products/edit/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EditProductPreview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

             <Route
              path="/product-view/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProductViewStatic />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

             <Route
              path="/ExpenseSummary"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ExpenseSummary />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/CashWithdrawl"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CashWithdrawl />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/Billing"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Billing />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/DailyInventory"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DailyInventory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/RealTimeInventory"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RealTimeInventory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
               <Route
              path="/SlocStock"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SlocStock />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/Bannerspage"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Bannerspage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/PreShortSupply"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PreShortSupply />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

             {/* ---------- GST routes (new) ---------- */}
            <Route
              path="/Sales-Banner"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SalesBanner />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Gst/GstCacheReport"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <GstCacheReport />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Reports"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Reports />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/Social-Media"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SocialMedia />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* ---------- end GST routes ---------- */}
 
            {/* ---------- start VENDOR routes ---------- */}
            <Route
              path="/NewVendor"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <NewVendor />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/CustomerList"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <VendorList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             
           {/* ---------- end VENDOR routes ---------- */}

            {/* ---------- start REVIST routes ---------- */}
            <Route
              path="/Site-Settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profilepage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/Shop-Settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ShopSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
           {/* ---------- end REVISIT routes ---------- */}

            {/* ---------- start MANAGEMENT routes ---------- */}
            <Route
              path="Management/AssetsManagement"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AssetsManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="Management/RouteManagement"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RouteManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="Discount"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Disconts />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="Management/CategoryManagement"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CategoryManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
           {/* ---------- end MANAGEMENT routes ---------- */}
             <Route
              path="VehiclePayments/RentVehiclePaymentsList"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RentVehiclePaymentsList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="VehiclePayments/ConsolidatedVehiclePay"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ConsolidatedVehiclePay />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/FranchiseRequests"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <FranchiseRequests />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <NotFound />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        </VariantProvider>
        </CategoriesProvider>
        </GstProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </Provider>
);

export default App;
