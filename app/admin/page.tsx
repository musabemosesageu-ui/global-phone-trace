"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, CheckCircle, FileText, ExternalLink } from "lucide-react";

export default function AdminVerificationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    const { data, error } = await supabase
      .from("incident_reports")
      .select(`
        *,
        devices (*, users(full_name, phone_number, national_id_number))
      `)
      .order("created_at", { ascending: false });

    if (!error && data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const viewEvidenceFile = async (filePath: string) => {
    if (!filePath) {
      alert("No document uploaded for this field.");
      return;
    }
    const { data, error } = await supabase.storage
      .from("evidence_vault")
      .createSignedUrl(filePath, 300);

    if (error || !data) {
      alert("Unable to generate secure link. Check admin permissions.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const updateIncidentStatus = async (
    reportId: string,
    deviceId: string,
    newDeviceStatus: "stolen" | "recovered" | "clean"
  ) => {
    await supabase
      .from("incident_reports")
      .update({ admin_verified: true })
      .eq("id", reportId);

    await supabase
      .from("devices")
      .update({ status: newDeviceStatus })
      .eq("id", deviceId);

    alert(`Device updated to: ${newDeviceStatus.toUpperCase()}`);
    loadReports();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white py-4 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              The Motivation Center Uganda — Staff Portal
            </p>
            <h1 className="text-xl font-bold">Theft Verification & Recovery Command</h1>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white">
            Public Registry →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        {loading ? (
          <p>Loading incident queue...</p>
        ) : reports.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border text-center">
            No theft or loss reports submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => {
              const dev = rep.devices;
              const owner = dev?.users;
              return (
                <div
                  key={rep.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800">
                        {rep.incident_type}
                      </span>
                      {rep.admin_verified && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Admin Verified
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        Police Ref: {rep.police_reference_no || "Pending"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">
                      {dev?.brand} {dev?.model} ({dev?.device_type})
                    </h2>
                    <p className="text-sm font-mono text-slate-700">
                      IMEI 1: {dev?.imei_1 || "N/A"} | Serial: {dev?.serial_number || "N/A"}
                    </p>
                    <p className="text-sm text-slate-600">
                      <strong>Owner:</strong> {owner?.full_name} ({owner?.phone_number}) —{" "}
                      <strong>NIN:</strong> {owner?.national_id_number}
                    </p>
                    <p className="text-sm text-slate-600">
                      <strong>Incident Location:</strong> {rep.location_text} —{" "}
                      <em>&ldquo;{rep.description}&rdquo;</em>
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => viewEvidenceFile(dev?.receipt_url)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4 text-blue-600" /> View Receipt{" "}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => viewEvidenceFile(dev?.national_id_url)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4 text-amber-600" /> View National ID{" "}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 shrink-0 min-w-[210px]">
                    <button
                      onClick={() => updateIncidentStatus(rep.id, dev.id, "stolen")}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" /> Verify & Lock Stolen
                    </button>
                    <button
                      onClick={() => updateIncidentStatus(rep.id, dev.id, "recovered")}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Mark Device Recovered
                    </button>
                    <button
                      onClick={() => updateIncidentStatus(rep.id, dev.id, "clean")}
                      className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      Dismiss / Clear Flag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
