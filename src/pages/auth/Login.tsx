import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../context/AuthContext";

const ROLE_BUTTONS: { role: Role; label: string }[] = [
  { role: "patient", label: "Patient" },
  { role: "doctor", label: "Doctor" },
  { role: "admin", label: "Admin" },
  { role: "staff", label: "Staff" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSelect(role: Role) {
    login(role);
    navigate(`/${role}/dashboard`, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-semibold text-gray-900">Medical Clinic</h1>
        <div className="grid grid-cols-2 gap-4">
          {ROLE_BUTTONS.map(({ role, label }) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelect(role)}
              className="rounded-lg border border-gray-200 bg-white px-10 py-5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
