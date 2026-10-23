import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { ErrorText, Field, IdField } from "../../components/FormControls";
import { LogoMark } from "../../components/public/icons";
import { FOCUS, PRIMARY_BUTTON } from "../../components/public/shared";
import { useAuth } from "../../context/AuthContext";
import type { AuthUser } from "../../context/AuthContext";
import { api, apiErrorMessage } from "../../api";
import type { PatientAuthResponse, PatientSignupRequest, StaffAuthResponse } from "../../types";
import { formatId, parseId } from "../../utils/id";

type PatientMode = "login" | "signup";

const EMPTY_SIGNUP: PatientSignupRequest & { confirmPassword: string } = {
  firstName: "",
  lastName: "",
  dob: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const TEXT_BUTTON = `rounded font-semibold text-teal-700 hover:text-navy hover:underline ${FOCUS}`;

const HEADING = "text-center font-heading text-[1.75rem] leading-tight font-semibold text-navy";

// patient sign in and registration
export function PatientLoginPage() {
  const { login } = useAuth();
  return (
    <AuthPage help="Need help signing in? Call your clinic office.">
      <PatientPanel onLogin={login} />
    </AuthPage>
  );
}

// employee sign in; the backend decides which workspace they get
export function EmployeeLoginPage() {
  const { login } = useAuth();
  return (
    <AuthPage help="Can't sign in? Ask a clinic administrator to reset your password or reactivate your login.">
      <StaffPanel onLogin={login} />
    </AuthPage>
  );
}

function AuthPage({ help, children }: { help: string; children: ReactNode }) {
  const { role, loading } = useAuth();

  // anyone already signed in (including right after signing in) goes to their own dashboard
  if (role) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return (
    // extra padding at the bottom so the column sits a little above center
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 pt-8 pb-12 text-slate-700">
      <div className="w-full max-w-[22rem]">
        <header className="flex justify-center">
          <Link to="/" aria-label="Medical Clinic home" className={`flex items-center gap-3 rounded-lg text-navy ${FOCUS}`}>
            <LogoMark />
            <span className="leading-tight">
              <span className="block text-lg font-bold tracking-tight">Medical Clinic</span>
              <span className="block text-[0.65rem] font-semibold tracking-[0.16em] text-teal-700 uppercase">Primary &amp; Specialty Care</span>
            </span>
          </Link>
        </header>

        <main className="mt-10">
          {/* the shared form fields use blue focus styles, so switch them to teal here */}
          <div className="[&_input:focus]:border-teal-600 [&_input:focus]:ring-teal-600">
            {loading ? <p className="text-center text-sm text-slate-500">Checking your sign-in...</p> : children}
          </div>
          <p className="mt-6 text-center text-sm leading-relaxed text-slate-500">{help}</p>
        </main>
      </div>
    </div>
  );
}

function FormButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={submitting} className={`${PRIMARY_BUTTON} w-full disabled:opacity-60`}>
      {submitting ? "Please wait..." : label}
    </button>
  );
}

function toPatientUser(p: PatientAuthResponse): AuthUser {
  return { role: "patient", id: p.patientId, firstName: p.firstName, lastName: p.lastName };
}

function PatientPanel({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<PatientMode>("login");
  const [patientId, setPatientId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(EMPTY_SIGNUP);
  const [created, setCreated] = useState<PatientAuthResponse | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: PatientMode) {
    setMode(next);
    setError("");
  }

  // patient login
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const id = parseId(patientId);
    if (!id) {
      setError("Invalid patient number. It must be 8 digits, e.g. 00000123.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<PatientAuthResponse>("/api/auth/patient/login", { patientId: id, email, password });
      onLogin(toPatientUser(res.data));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // create account
  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (signup.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (signup.password !== signup.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const { firstName, lastName, dob, phone, email, password } = signup;
      const res = await api.post<PatientAuthResponse>("/api/auth/patient/signup", { firstName, lastName, dob, phone, email, password });
      setCreated(res.data);
      setSignup(EMPTY_SIGNUP);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // account created
  if (created) {
    return (
      <div className="space-y-4 text-center">
        <h1 className={HEADING}>Account created</h1>
        <p className="text-sm text-slate-600">Your patient number is</p>
        <p className="text-4xl font-bold tracking-wider text-navy">{formatId(created.patientId)}</p>
        <p className="text-sm text-slate-600">Save this number. You'll need it with your email and password to sign in.</p>
        <button type="button" onClick={() => onLogin(toPatientUser(created))} className={`${PRIMARY_BUTTON} w-full`}>
          Continue to Patient Portal
        </button>
      </div>
    );
  }

  const set = (field: keyof typeof signup) => (e: ChangeEvent<HTMLInputElement>) =>
    setSignup({ ...signup, [field]: e.target.value });

  return mode === "login" ? (
    <form onSubmit={handleLogin} className="space-y-4">
      <h1 className={`${HEADING} mb-6`}>Patient Sign In</h1>
      <div>
        <IdField label="Patient number" value={patientId} onChange={setPatientId} />
        <p className="mt-1 text-xs text-slate-500">Use the patient number you received when you created your account.</p>
      </div>
      <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <ErrorText message={error} />
      <div className="pt-1">
        <FormButton submitting={submitting} label="Sign In" />
      </div>
      <p className="text-center text-sm text-slate-600">
        New patient?{" "}
        <button type="button" onClick={() => switchMode("signup")} className={TEXT_BUTTON}>
          Create an account
        </button>
      </p>
    </form>
  ) : (
    <form onSubmit={handleSignup} className="space-y-4">
      <h1 className={`${HEADING} mb-6`}>Create your patient account</h1>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
        <Field label="First name" required value={signup.firstName} onChange={set("firstName")} />
        <Field label="Last name" required value={signup.lastName} onChange={set("lastName")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
        <Field label="Date of birth" type="date" required value={signup.dob} onChange={set("dob")} />
        <Field label="Phone" type="tel" required value={signup.phone} onChange={set("phone")} />
      </div>
      <Field label="Email" type="email" required autoComplete="email" value={signup.email} onChange={set("email")} />
      <Field label="Password" type="password" required minLength={8} autoComplete="new-password" value={signup.password} onChange={set("password")} />
      <Field label="Confirm password" type="password" required autoComplete="new-password" value={signup.confirmPassword} onChange={set("confirmPassword")} />
      <ErrorText message={error} />
      <div className="pt-1">
        <FormButton submitting={submitting} label="Create Account" />
      </div>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <button type="button" onClick={() => switchMode("login")} className={TEXT_BUTTON}>
          Sign in
        </button>
      </p>
    </form>
  );
}

function StaffPanel({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // staff login
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const id = parseId(employeeId);
    if (!id) {
      setError("Invalid employee ID. It must be 8 digits, e.g. 00001001.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<StaffAuthResponse>("/api/auth/staff/login", { employeeId: id, password });
      const staff = res.data;
      onLogin({ 
        role: staff.role, 
        id: staff.employeeId, 
        firstName: staff.firstName, 
        lastName: staff.lastName, 
        staffType: staff.staffType, 
        officeId: staff.officeId 
      });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h1 className={`${HEADING} mb-6`}>Employee Sign In</h1>
      <IdField label="Employee ID" value={employeeId} onChange={setEmployeeId} />
      <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <ErrorText message={error} />
      <div className="pt-1">
        <FormButton submitting={submitting} label="Sign In" />
      </div>
    </form>
  );
}
