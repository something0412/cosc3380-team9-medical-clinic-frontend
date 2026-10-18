import { Navigate, Route, Routes } from "react-router-dom";
import { RoleLayout } from "./layouts/RoleLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { LoginPage } from "./pages/auth/Login";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import LabOrders from "./pages/doctor/lab_orders";
import Patients from "./pages/doctor/patients";
import Referrals from "./pages/doctor/referrals";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { StaffDashboard } from "./pages/staff/Dashboard";
import { AdminAnalytics } from "./pages/admin/Analytics";


function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/patient" element={<RoleLayout role="patient" />}>
                <Route index element={<Navigate to="dashboard" replace />} />   
                <Route path="dashboard" element={<PatientDashboard />} />
            </Route>

            <Route path="/doctor" element={<RoleLayout role="doctor" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="lab-orders" element={<LabOrders />} />
                <Route path="patients" element={<Patients />} />
                <Route path="referrals" element={<Referrals />} />
            </Route>

            <Route path="/admin" element={<RoleLayout role="admin" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            <Route path="/staff" element={<RoleLayout role="staff" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StaffDashboard />} />
            </Route>
        </Routes>
    );
}

export default App;