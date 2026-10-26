import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { FormActions, Section, StatusBadge, TextButton } from "../../components/ProfileUI";

interface Referral {
  referralId: number;
  patientId: number;
  patientName: string;
  referringDoctorName: string;
  specialistName: string;
  specialty: string;
  dateIssued: string;
  expirationDate: string;
  status: string;
  expired: boolean;
}

interface PatientOption {
  patientId: number;
  firstName: string;
  lastName: string;
}

interface Specialist {
  doctorId: number;
  doctorName: string;
  specialties: { specialtyId: number; name: string; requiresReferral: boolean }[];
}

// a pending referral past its date shows as expired
const shownStatus = (r: Referral) => (r.status === "Pending" && r.expired ? "Expired" : r.status);

export function DoctorReferrals() {
  const [sent, setSent] = useState<Referral[]>([]);
  const [received, setReceived] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // load referrals
  useEffect(() => {
    async function loadReferrals() {
      try {
        const res = await api.get<{ sent: Referral[]; received: Referral[] }>("/api/doctor/referrals");
        setSent(res.data.sent);
        setReceived(res.data.received);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadReferrals();
  }, [reloadCount]);

  // approve or deny
  async function answerReferral(referral: Referral, status: "Approved" | "Denied") {
    setError("");
    try {
      await api.patch(`/api/doctor/referrals/${referral.referralId}/status`, { status });
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <PortalPage
      eyebrow="Doctor"
      title="Referrals"
      description="Send patients to specialists and answer referrals sent to you. Once approved, the patient or the front desk books the visit."
      actions={
        <button type="button" onClick={() => setShowForm(true)} className={ADMIN_PRIMARY_BUTTON}>
          New Referral
        </button>
      }
    >
      <PageError message={error} />
      {loading && <p className="text-slate-500">Loading referrals...</p>}

      {!loading && (
        <>
          <Section title="Sent to Me">
            {received.length === 0 ? (
              <p className="text-slate-500">No referrals sent to you.</p>
            ) : (
              <ReferralTable
                referrals={received}
                otherLabel="From"
                otherName={(r) => r.referringDoctorName}
                actions={(r) =>
                  r.status === "Pending" && !r.expired ? (
                    <span className="flex justify-end gap-4">
                      <TextButton onClick={() => answerReferral(r, "Approved")}>Approve</TextButton>
                      <TextButton danger onClick={() => answerReferral(r, "Denied")}>Deny</TextButton>
                    </span>
                  ) : null
                }
              />
            )}
          </Section>

          <Section title="Sent by Me">
            {sent.length === 0 ? (
              <p className="text-slate-500">You haven't sent any referrals.</p>
            ) : (
              <ReferralTable referrals={sent} otherLabel="Specialist" otherName={(r) => r.specialistName} actions={() => null} />
            )}
          </Section>
        </>
      )}

      {showForm && <NewReferralModal onClose={() => setShowForm(false)} onSaved={() => setReloadCount(reloadCount + 1)} />}
    </PortalPage>
  );
}

function ReferralTable({
  referrals,
  otherLabel,
  otherName,
  actions,
}: {
  referrals: Referral[];
  otherLabel: string;
  otherName: (r: Referral) => string;
  actions: (r: Referral) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">{otherLabel}</th>
            <th className="px-4 py-3">Specialty</th>
            <th className="px-4 py-3">Issued</th>
            <th className="px-4 py-3">Expires</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {referrals.map((r) => (
            <tr key={r.referralId} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3">
                <Link to={`/doctor/patients/${r.patientId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                  {r.patientName}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">Dr. {otherName(r)}</td>
              <td className="px-4 py-3 text-slate-700">{r.specialty}</td>
              <td className="px-4 py-3 text-slate-700">{r.dateIssued}</td>
              <td className="px-4 py-3 text-slate-700">{r.expirationDate}</td>
              <td className="px-4 py-3"><StatusBadge status={shownStatus(r)} /></td>
              <td className="px-4 py-3 text-right">{actions(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewReferralModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patientId, setPatientId] = useState("");
  const [specialistKey, setSpecialistKey] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load patients and specialists for the dropdowns
  useEffect(() => {
    async function loadOptions() {
      try {
        const patientsRes = await api.get<PatientOption[]>("/api/doctor/patients");
        setPatients(patientsRes.data);
        const specialistsRes = await api.get<Specialist[]>("/api/doctor/specialists");
        setSpecialists(specialistsRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadOptions();
  }, []);

  // send the referral
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const [specialistDoctorId, specialtyId] = specialistKey.split("-");
    try {
      await api.post("/api/doctor/referrals", {
        patientId: Number(patientId),
        specialistDoctorId: Number(specialistDoctorId),
        specialtyId: Number(specialtyId),
        expirationDate: expirationDate || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Referral" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Patient" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>{p.lastName}, {p.firstName}</option>
          ))}
        </SelectField>
        <SelectField label="Specialist" required value={specialistKey} onChange={(e) => setSpecialistKey(e.target.value)}>
          <option value="">Select a specialist</option>
          {specialists.map((s) =>
            s.specialties.map((sp) => (
              <option key={`${s.doctorId}-${sp.specialtyId}`} value={`${s.doctorId}-${sp.specialtyId}`}>
                {sp.name} · Dr. {s.doctorName}
              </option>
            ))
          )}
        </SelectField>
        <Field
          label="Expiration Date (optional, defaults to 90 days)"
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
        />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Send Referral" />
      </form>
    </Modal>
  );
}
