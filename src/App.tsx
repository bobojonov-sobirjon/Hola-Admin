import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import VerifyCode from "./pages/AuthPages/VerifyCode";
import UserProfiles from "./pages/UserProfiles";
import RidersList from "./pages/Accounts/RidersList";
import RiderDetails from "./pages/Accounts/RiderDetails";
import DriversList from "./pages/Accounts/DriversList";
import DriverDetails from "./pages/Accounts/DriverDetails";
import VerificationDriversList from "./pages/Accounts/VerificationDriversList";
import VerificationDriverDetails from "./pages/Accounts/VerificationDriverDetails";
import LegalDriverIdentificationList from "./pages/Accounts/LegalDriverIdentificationList";
import LegalDriverIdentificationDetails from "./pages/Accounts/LegalDriverIdentificationDetails";
import TermsDriverIdentificationList from "./pages/Accounts/TermsDriverIdentificationList";
import TermsDriverIdentificationDetails from "./pages/Accounts/TermsDriverIdentificationDetails";
import RegistrationDriverIdentificationList from "./pages/Accounts/RegistrationDriverIdentificationList";
import RegistrationDriverIdentificationDetails from "./pages/Accounts/RegistrationDriverIdentificationDetails";
import UploadDriverIdentificationList from "./pages/Accounts/UploadDriverIdentificationList";
import UploadDriverIdentificationDetails from "./pages/Accounts/UploadDriverIdentificationDetails";
import SavedCards from "./pages/Cards/SavedCards";
import OrdersList from "./pages/Orders/OrdersList";
import OrderDetails from "./pages/Orders/OrderDetails";
import RideTypes from "./pages/Orders/02RideTypes";
import RideTypeDetails from "./pages/Orders/02RideTypeDetails";
import SurgePricings from "./pages/Orders/07SurgePricings";
import SurgePricingDetails from "./pages/Orders/07SurgePricingDetails";
import RatingFeedback from "./pages/Orders/12RatingFeedback";
import RatingFeedbackDetails from "./pages/Orders/12RatingFeedbackDetails";
import CashoutsList from "./pages/Withdrawals/CashoutsList";
import CashoutDetails from "./pages/Withdrawals/CashoutDetails";
import SupportRoomsList from "./pages/Chat/SupportRoomsList";
import SupportRoomChat from "./pages/Chat/SupportRoomChat";

function isVerified() {
  return localStorage.getItem("auth_verified") === "true";
}

function RequireVerified({ children }: { children: React.ReactNode }) {
  if (!isVerified()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route
              index
              path="/"
              element={
                <RequireVerified>
                  <Home />
                </RequireVerified>
              }
            />

            <Route
              path="/profile"
              element={
                <RequireVerified>
                  <UserProfiles />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/riders"
              element={
                <RequireVerified>
                  <RidersList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/riders/:id"
              element={
                <RequireVerified>
                  <RiderDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/drivers"
              element={
                <RequireVerified>
                  <DriversList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/drivers/:id"
              element={
                <RequireVerified>
                  <DriverDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/verification-drivers"
              element={
                <RequireVerified>
                  <VerificationDriversList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/verification-drivers/:id"
              element={
                <RequireVerified>
                  <VerificationDriverDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/legal-driver-ids"
              element={
                <RequireVerified>
                  <LegalDriverIdentificationList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/legal-driver-ids/:id"
              element={
                <RequireVerified>
                  <LegalDriverIdentificationDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/terms-driver-ids"
              element={
                <RequireVerified>
                  <TermsDriverIdentificationList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/terms-driver-ids/:id"
              element={
                <RequireVerified>
                  <TermsDriverIdentificationDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/registration-drivers"
              element={
                <RequireVerified>
                  <RegistrationDriverIdentificationList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/registration-drivers/:id"
              element={
                <RequireVerified>
                  <RegistrationDriverIdentificationDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/accounts/upload-driver-licenses"
              element={
                <RequireVerified>
                  <UploadDriverIdentificationList />
                </RequireVerified>
              }
            />
            <Route
              path="/accounts/upload-driver-licenses/:id"
              element={
                <RequireVerified>
                  <UploadDriverIdentificationDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/cards/saved-cards"
              element={
                <RequireVerified>
                  <SavedCards />
                </RequireVerified>
              }
            />

            <Route path="/orders/orders" element={<RequireVerified><OrdersList /></RequireVerified>} />
            <Route path="/orders/orders/:id" element={<RequireVerified><OrderDetails /></RequireVerified>} />

            <Route path="/orders/ride-types" element={<RequireVerified><RideTypes /></RequireVerified>} />
            <Route path="/orders/ride-types/:id" element={<RequireVerified><RideTypeDetails /></RequireVerified>} />

            <Route path="/orders/surge-pricings" element={<RequireVerified><SurgePricings /></RequireVerified>} />
            <Route path="/orders/surge-pricings/:id" element={<RequireVerified><SurgePricingDetails /></RequireVerified>} />

            <Route path="/orders/rating-feedback" element={<RequireVerified><RatingFeedback /></RequireVerified>} />
            <Route path="/orders/rating-feedback/:id" element={<RequireVerified><RatingFeedbackDetails /></RequireVerified>} />

            <Route
              path="/withdrawal/cash-outs"
              element={
                <RequireVerified>
                  <CashoutsList />
                </RequireVerified>
              }
            />
            <Route
              path="/withdrawal/cash-outs/:id"
              element={
                <RequireVerified>
                  <CashoutDetails />
                </RequireVerified>
              }
            />

            <Route
              path="/chat/support/rooms"
              element={
                <RequireVerified>
                  <SupportRoomsList />
                </RequireVerified>
              }
            />
            <Route
              path="/chat/support/rooms/:id"
              element={
                <RequireVerified>
                  <SupportRoomChat />
                </RequireVerified>
              }
            />

            {/*
              QOLGAN PAGE'LAR HOZIRCHA COMMENT:
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/basic-tables" element={<BasicTables />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            */}
          </Route>

          {/* Auth Layout */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/verify-code" element={<VerifyCode />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
