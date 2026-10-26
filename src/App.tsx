import { Navigate, Route, Routes } from "react-router-dom";

import { RoleLayout } from "./layouts/RoleLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { HomePage } from "./pages/public/HomePage";
import { NotFound } from "./pages/public/NotFound";
import { FindDoctorPage } from "./pages/public/FindDoctor";
import { DoctorProfilePage } from "./pages/public/DoctorProfile";
import { LocationsPage } from "./pages/public/Locations";
import { LocationDetailsPage } from "./pages/public/LocationDetails";
import { ServicesPage } from "./pages/public/Services";
import { AboutPage } from "./pages/public/About";
import { ContactPage } from "./pages/public/Contact";
import { BookAppointmentPage } from "./pages/public/BookAppointment";
import { BookReviewPage } from "./pages/public/BookReview";
import { BookConfirmationPage } from "./pages/public/BookConfirmation";

import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminEmployees } from "./pages/admin/Employees";
import { AdminEmployeeDetails } from "./pages/admin/EmployeeDetails";
import {
    AdminEmployeeCreate,
    AdminEmployeeEdit,
} from "./pages/admin/EmployeeForm";
import { AdminOffices } from "./pages/admin/Offices";
import { AdminOfficeDetails } from "./pages/admin/OfficeDetails";
import { AdminOfficeCreate, AdminOfficeEdit } from "./pages/admin/OfficeForm";
import { AdminSpecialties } from "./pages/admin/Specialties";
import { AdminSpecialtyDetails } from "./pages/admin/SpecialtyDetails";
import {
    AdminSpecialtyCreate,
    AdminSpecialtyEdit,
} from "./pages/admin/SpecialtyForm";
import { AdminSchedules } from "./pages/admin/Schedules";
import {
    AdminScheduleCreate,
    AdminScheduleEdit,
} from "./pages/admin/ScheduleForm";
import { AdminShiftSettings } from "./pages/admin/ShiftSettings";
import { AdminPatients } from "./pages/admin/Patients";
import { AdminBilling } from "./pages/admin/Billing";

import { EmployeeLoginPage, PatientLoginPage } from "./pages/auth/Login";

import { DoctorAppointments } from "./pages/doctor/Appointments";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { DoctorLabOrders } from "./pages/doctor/LabOrders";
import { DoctorPatientChart } from "./pages/doctor/PatientChart";
import { DoctorPatients } from "./pages/doctor/Patients";
import { DoctorReferrals } from "./pages/doctor/Referrals";
import { DoctorSchedule } from "./pages/doctor/Schedule";
import { DoctorVisit } from "./pages/doctor/Visit";
import { LabDashboard } from "./pages/lab/Dashboard";
import { LabOrders } from "./pages/lab/LabOrders";
import { StaffDashboard } from "./pages/staff/Dashboard";
import { NurseTodayPatients } from "./pages/nurse/TodayPatients";
import { NurseIntake } from "./pages/nurse/Intake";
import { NursePatients } from "./pages/nurse/Patients";
import { NursePatientChart } from "./pages/nurse/PatientChart";
import { NurseSupplies } from "./pages/nurse/Supplies";
import { ReceptionistAppointments } from "./pages/receptionist/Appointments";
import { ReceptionistPatients } from "./pages/receptionist/Patients";
import { ReceptionistPatientDetail } from "./pages/receptionist/PatientDetail";
import { ReceptionistBilling } from "./pages/receptionist/Billing";

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
        <Route path="/find-a-doctor" element={<FindDoctorPage />} />
        <Route path="/find-a-doctor/:id" element={<DoctorProfilePage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/locations/:id" element={<LocationDetailsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/book" element={<BookAppointmentPage />} />
        <Route path="/book/review" element={<BookReviewPage />} />
        <Route path="/book/confirmed/:appointmentId" element={<BookConfirmationPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<PatientLoginPage />} />
      <Route path="/employee/login" element={<EmployeeLoginPage />} />

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
                <Route path="lab-orders" element={<DoctorLabOrders />} />
                <Route path="referrals" element={<DoctorReferrals />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="patients/:id" element={<DoctorPatientChart />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="appointments/:id" element={<DoctorVisit />} />
                <Route path="schedule" element={<DoctorSchedule />} />
                <Route path="profile" element={<StaffProfile />} />
            </Route>

            {/* admin routes */}
            <Route path="/admin" element={<RoleLayout role="admin" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="employees" element={<AdminEmployees />} />
                <Route path="employees/new" element={<AdminEmployeeCreate />} />
                <Route
                    path="employees/:id"
                    element={<AdminEmployeeDetails />}
                />
                <Route
                    path="employees/:id/edit"
                    element={<AdminEmployeeEdit />}
                />
                <Route path="offices" element={<AdminOffices />} />
                <Route path="offices/new" element={<AdminOfficeCreate />} />
                <Route path="offices/:id" element={<AdminOfficeDetails />} />
                <Route path="offices/:id/edit" element={<AdminOfficeEdit />} />
                <Route path="specialties" element={<AdminSpecialties />} />
                <Route
                    path="specialties/new"
                    element={<AdminSpecialtyCreate />}
                />
                <Route
                    path="specialties/:id"
                    element={<AdminSpecialtyDetails />}
                />
                <Route
                    path="specialties/:id/edit"
                    element={<AdminSpecialtyEdit />}
                />
                <Route path="schedules" element={<AdminSchedules />} />
                <Route path="schedules/new" element={<AdminScheduleCreate />} />
                <Route
                    path="schedules/shifts"
                    element={<AdminShiftSettings />}
                />
                <Route
                    path="schedules/:doctorId/:dayOfWeek/edit"
                    element={<AdminScheduleEdit />}
                />
                <Route path="patients" element={<AdminPatients />} />
                <Route path="billing" element={<AdminBilling />} />
                <Route path="profile" element={<StaffProfile />} />
            </Route>

            {/* staff routes (nurses and receptionists) */}
            <Route path="/staff" element={<RoleLayout role="staff" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="profile" element={<StaffProfile />} />

                {/* nurse pages */}
                <Route path="nurse/today" element={<NurseTodayPatients />} />
                <Route path="nurse/today/:appointmentId" element={<NurseIntake />} />
                <Route path="nurse/patients" element={<NursePatients />} />
                <Route path="nurse/patients/:patientId" element={<NursePatientChart />} />
                <Route path="nurse/supplies" element={<NurseSupplies />} />

                {/* receptionist pages */}
                <Route path="reception/appointments" element={<ReceptionistAppointments />} />
                <Route path="reception/patients" element={<ReceptionistPatients />} />
                <Route path="reception/patients/:patientId" element={<ReceptionistPatientDetail />} />
                <Route path="reception/billing" element={<ReceptionistBilling />} />
            </Route>

            {/* lab technician routes */}
            <Route path="/lab" element={<RoleLayout role="lab" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<LabDashboard />} />
                <Route path="orders" element={<LabOrders />} />
                <Route path="profile" element={<StaffProfile />} />
            </Route>
        </Routes>
    );
}

export default App;
