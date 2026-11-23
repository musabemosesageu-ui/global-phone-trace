"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BadgeCheck, Search, FileCheck2, ShieldAlert } from "lucide-react";

export default function PolicePortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [record, setRecord] = useState<any | null>(null);
  const [sdNumber, setSdNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLawEnforcementLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecord(null);

    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*, users(full_name, phone_number, national_id_number), incident_reports(*)")
        .or(`imei_1.eq.${searchQuery},imei_2.eq.${searchQuery},serial_number.eq.${searchQuery}`)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        alert("No matching device found in Global Phone Trace registry.");
      } else {
        setRecord(data);
      }
    } catch (err: any) {
      alert("Access denied or search error. Ensure your Police Partner account is active.");
    } finally {
      setLoading(false);
    }
  };

  const attachPoliceCase = async () => {
    if (!record || !sdNumber) return;
    await supabase
      .from("devices")
      .update({ status: "stolen" })
      .eq("id", record.id);

    alert(`Official Police Reference (${sdNumber}) attached. Device is now flagged STOLEN nationwide.`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white py-4 px-6 border-b border-amber-500/40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
              Authorized Law Enforcement Access Only
            </span>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BadgeCheck className="text-amber-400 w-6 h-6" />
              Global Phone Trace — Police Verification Desk
            </h1>
          </div>
          <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-300">
            The Motivation Center Uganda
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="font-bold text-lg mb-2">Verify Device Ownership & Theft Record</h2>
          <p className="text-sm text-slate-600 mb-4">
            Enter a 15-digit IMEI or Laptop Serial Number to inspect verified owner identity, National ID, and active theft claims.
          </p>

          <form onSubmit={handleLawEnforcementLookup} className="flex gap-3">
            <input
              required
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.trim())}
              placeholder="Enter IMEI or Serial Number..."
              className="flex-1 p-3 border rounded-xl font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? "Verifying..." : "Inspect Record"}
            </button>
          </form>
        </div>

        {record && (
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border space-y-5">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-amber-100 text-amber-900">
                  Registry Status: {record.status}
                </span>
                <h3 className="text-2xl font-bold mt-2">
                  {record.brand} {record.model} ({record.device_type.toUpperCase()})
                </h3>
              </div>
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <h4 className="font-bold text-slate-800 mb-2">Verified Legal Owner</h4>
                <p><strong>Full Name:</strong> {record.users?.full_name}</p>
                <p><strong>National ID (NIN):</strong> <span className="font-mono">{record.users?.national_id_number}</span></p>
                <p><strong>Contact Tel:</strong> {record.users?.phone_number}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border">
                <h4 className="font-bold text-slate-800 mb-2">Hardware Identifiers</h4>
                <p><strong>IMEI 1:</strong> <span className="font-mono">{record.imei_1 || "N/A"}</span></p>
                <p><strong>IMEI 2:</strong> <span className="font-mono">{record.imei_2 || "N/A"}</span></p>
                <p><strong>Serial No:</strong> <span className="font-mono">{record.serial_number || "N/A"}</span></p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-bold text-amber-950 flex items-center gap-2 mb-2">
                <FileCheck2 className="w-5 h-5" /> Official Police Endorsement & Blacklist Lock
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter Uganda Police SD / CRB Reference (e.g. SD REF 45/22/11/2026)"
                  value={sdNumber}
                  onChange={(e) => setSdNumber(e.target.value)}
                  className="flex-1 p-2.5 border rounded-lg bg-white text-sm font-mono"
                />
                <button
                  onClick={attachPoliceCase}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-sm"
                >
                  Confirm Official Stolen Status
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
