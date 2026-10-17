import { Navigate, Route, Routes } from "react-router-dom";
import { RoleLayout } from "./layouts/RoleLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { LoginPage } from "./pages/auth/Login";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { StaffDashboard } from "./pages/staff/Dashboard";
import { AdminAnalytics } from "./pages/admin/Analytics";
import { StaffAppointment } from "./pages/staff/Appoinment";
import { PatientCharts } from "./pages/staff/nursing/PatientCharts";
import { RNPage } from "./pages/staff/nursing/RNPage";
import { CRNAPage } from "./pages/staff/nursing/CRNAPage";
import { NAPage } from "./pages/staff/nursing/NAPage";

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
            </Route>

            <Route path="/admin" element={<RoleLayout role="admin" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            <Route path="/staff" element={<RoleLayout role="staff" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="appointment" element={<StaffAppointment />} />
                <Route path="charts" element={<PatientCharts />} />
                <Route path="rn" element={<RNPage />} />
                <Route path="crna" element={<CRNAPage />} />
                <Route path="na" element={<NAPage />} />
            </Route>
        </Routes>
    );
}

export default App;