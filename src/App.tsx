import { Navigate, Route, Routes } from "react-router-dom";

import { RoleLayout } from "./layouts/RoleLayout";
import { StaffTypeGuard } from "./layouts/StaffTypeGuard";
import { PublicLayout } from "./layouts/PublicLayout";
import { HomePage } from "./pages/public/HomePage";
import { ComingSoon } from "./pages/public/ComingSoon";

import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminAnalytics } from "./pages/admin/Analytics";

import { LoginPage } from "./pages/auth/Login";

import { DoctorDashboard } from "./pages/doctor/Dashboard";

import { StaffDashboard } from "./pages/staff/Dashboard";
import { StaffBilling } from "./pages/staff/Billing";
import { FrontDesk } from "./pages/staff/frontdesk/FrontDesk";
import { Patients } from "./pages/staff/frontdesk/Patients";
import { Receipt } from "./pages/staff/frontdesk/Receipt";
import { Schedule } from "./pages/staff/frontdesk/Schedule";
import { PatientCharts } from "./pages/staff/nursing/PatientCharts";
import { RNPage } from "./pages/staff/nursing/RNPage";
import { Supplies } from "./pages/staff/nursing/Supplies";

import { PatientDashboard } from "./pages/patient/PatientDashboard";
import { PatientForms } from "./pages/patient/PatientForms";
import { PatientAppointments } from "./pages/patient/PatientAppointments";
import { PatientBilling } from "./pages/patient/PatientBilling";
import { PatientProfile } from "./pages/patient/PatientProfile";
import { PatientRecords } from "./pages/patient/PatientRecords";

import { StaffProfile } from "./pages/shared/StaffProfile";

function App() {
  return (
    <Routes>
      {/* public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/find-a-doctor" element={<ComingSoon title="Find a Doctor" />} />
        <Route path="/locations" element={<ComingSoon title="Locations" />} />
        <Route path="/services" element={<ComingSoon title="Services" />} />
        <Route path="/about" element={<ComingSoon title="About Us" />} />
        <Route path="/contact" element={<ComingSoon title="Contact Us" />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      {/* patient routes */}
      <Route path="/patient" element={<RoleLayout role="patient" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="forms" element={<PatientForms />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="billing" element={<PatientBilling />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="records" element={<PatientRecords />} />
      </Route>

      {/* doctor routes */}
      <Route path="/doctor" element={<RoleLayout role="doctor" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>

      {/* admin routes */}
      <Route path="/admin" element={<RoleLayout role="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>

      {/* staff routes */}
      <Route path="/staff" element={<RoleLayout role="staff" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route element={<StaffTypeGuard staffType="receptionist" />}>
          <Route path="front-desk" element={<FrontDesk />} />
          <Route path="patients" element={<Patients />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="billing" element={<StaffBilling />} />
          <Route path="billing/receipts/:paymentId" element={<Receipt />} />
        </Route>
        <Route element={<StaffTypeGuard staffType="nurse" />}>
          <Route path="charts" element={<PatientCharts />} />
          <Route path="rn" element={<RNPage />} />
          <Route path="supplies" element={<Supplies />} />
        </Route>
        <Route path="profile" element={<StaffProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
