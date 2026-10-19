import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorText, Field, IdField, SubmitButton } from "../../components/FormControls";
import { useAuth } from "../../context/AuthContext";
import type { AuthUser } from "../../context/AuthContext";
import { api, apiErrorMessage } from "../../api";
import type { PatientAuthResponse, PatientSignupRequest, StaffAuthResponse } from "../../types";
import { formatId, parseId } from "../../utils/id";

type Tab = "patient" | "staff";
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

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("patient");

  function finishLogin(user: AuthUser) {
    login(user);
    navigate(`/${user.role}/dashboard`, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold text-gray-900">Medical Clinic</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex border-b border-gray-200">
              {(["patient", "staff"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium capitalize ${
                    tab === t ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="px-4 text-lg text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {tab === "patient" ? <PatientPanel onLogin={finishLogin} /> : <StaffPanel onLogin={finishLogin} />}
            </div>
          </div>
        </div>
      )}
    </div>
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
        <h2 className="text-lg font-semibold text-gray-900">Account created</h2>
        <p className="text-sm text-gray-600">Your patient number is</p>
        <p className="text-4xl font-bold text-blue-600">{formatId(created.patientId)}</p>
        <p className="text-sm text-gray-600">Save this number. You'll need it with your email and password to log in.</p>
        <button
          type="button"
          onClick={() => onLogin(toPatientUser(created))}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Continue to Patient Portal
        </button>
      </div>
    );
  }

  const set = (field: keyof typeof signup) => (e: ChangeEvent<HTMLInputElement>) =>
    setSignup({ ...signup, [field]: e.target.value });

  return mode === "login" ? (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Patient Login</h2>
      <IdField label="Patient Number" value={patientId} onChange={setPatientId} />
      <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <ErrorText message={error} />
      <SubmitButton submitting={submitting} label="Log In" />
      <p className="text-center text-sm text-gray-600">
        New patient?{" "}
        <button type="button" onClick={() => switchMode("signup")} className="font-medium text-blue-600 hover:underline">
          Create an account
        </button>
      </p>
    </form>
  ) : (
    <form onSubmit={handleSignup} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Create Patient Account</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name" required value={signup.firstName} onChange={set("firstName")} />
        <Field label="Last Name" required value={signup.lastName} onChange={set("lastName")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of Birth" type="date" required value={signup.dob} onChange={set("dob")} />
        <Field label="Phone" type="tel" required value={signup.phone} onChange={set("phone")} />
      </div>
      <Field label="Email" type="email" required autoComplete="email" value={signup.email} onChange={set("email")} />
      <Field label="Password" type="password" required minLength={8} autoComplete="new-password" value={signup.password} onChange={set("password")} />
      <Field label="Confirm Password" type="password" required autoComplete="new-password" value={signup.confirmPassword} onChange={set("confirmPassword")} />
      <ErrorText message={error} />
      <SubmitButton submitting={submitting} label="Create Account" />
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <button type="button" onClick={() => switchMode("login")} className="font-medium text-blue-600 hover:underline">
          Log in
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
      setError("Invalid staff ID. It must be 8 digits, e.g. 00001001.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<StaffAuthResponse>("/api/auth/staff/login", { employeeId: id, password });
      const staff = res.data;
      onLogin({ role: staff.role, id: staff.employeeId, firstName: staff.firstName, lastName: staff.lastName });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Staff Login</h2>
      <IdField label="Staff ID" value={employeeId} onChange={setEmployeeId} />
      <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <ErrorText message={error} />
      <SubmitButton submitting={submitting} label="Log In" />
    </form>
  );
}
