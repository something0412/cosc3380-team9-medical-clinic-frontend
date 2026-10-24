import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { formatId } from "../../utils/id";

interface OfficePatient {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  phone: string;
  lastVisit: string | null;
}

export function NursePatients() {
  const [patients, setPatients] = useState<OfficePatient[]>([]);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // load patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get<OfficePatient[]>("/api/nurse/patients", { params: { search } });
        setPatients(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [search]);

  // search by name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <p className="mt-1 text-gray-600">Patients seen at your office.</p>
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Search
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-500">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Patient ID</th>
              <th className="p-3 font-medium">Date of Birth</th>
              <th className="p-3 font-medium">Gender</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Last Visit</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-3 text-gray-500">Loading patients...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={7} className="p-3 text-gray-500">No patients found.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.patientId} className="border-b last:border-0">
                  <td className="p-3">
                    <Link to={`/staff/nurse/patients/${p.patientId}`} className="font-medium text-blue-600 hover:underline">
                      {p.lastName}, {p.firstName}
                    </Link>
                  </td>
                  <td className="p-3">{formatId(p.patientId)}</td>
                  <td className="p-3">{p.dob}</td>
                  <td className="p-3">{p.gender ?? ""}</td>
                  <td className="p-3">{p.phone}</td>
                  <td className="p-3">{p.lastVisit ?? "—"}</td>
                  <td className="p-3">
                    <Link to={`/staff/nurse/patients/${p.patientId}`} className="text-blue-600 hover:underline">
                      Open chart
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
