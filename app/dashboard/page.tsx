"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, MapPin, PlusCircle } from "lucide-react";

export default function OwnerDashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingDevice, setReportingDevice] = useState<any | null>(null);
  const [incidentType, setIncidentType] = useState<"stolen" | "lost">("stolen");
  const [locationText, setLocationText] = useState("");
  const [policeRef, setPoliceRef] = useState("");
  const [description, setDescription] = useState("");

  const fetchMyDevices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("devices")
      .select("*, tracking_logs(latitude, longitude, recorded_at)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setDevices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyDevices();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingDevice) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("incident_reports").insert({
      device_id: reportingDevice.id,
      reporter_id: user.id,
      incident_type: incidentType,
      incident_date: new Date().toISOString(),
      location_text: locationText,
      police_reference_no: policeRef,
      description,
    });

    await supabase
      .from("devices")
      .update({ status: incidentType })
      .eq("id", reportingDevice.id);

    setReportingDevice(null);
    fetchMyDevices();
    alert("Alert active! Your device is now blacklisted across Global Phone Trace.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-400 uppercase font-semibold">
              The Motivation Center Uganda
            </p>
            <h1 className="text-lg font-bold">My Registered Devices</h1>
          </div>
          <a
            href="/register-device"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Add Device
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">
        {loading ? (
          <p>Loading your protected devices...</p>
        ) : devices.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border text-center">
            <p className="text-slate-600 mb-4">You haven&apos;t registered any phones or laptops yet.</p>
            <a
              href="/register-device"
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold"
            >
              Register Your First Device
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {devices.map((dev) => {
              const latestPing = dev.tracking_logs?.[0];
              return (
                <div key={dev.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400">
                        {dev.device_type}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900">
                        {dev.brand} {dev.model}
                      </h2>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        dev.status === "clean"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {dev.status}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-slate-600 space-y-1 font-mono">
                    {dev.imei_1 && <p>IMEI 1: {dev.imei_1}</p>}
                    {dev.serial_number && <p>Serial: {dev.serial_number}</p>}
                  </div>

                  {latestPing && (
                    <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-900 text-xs flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>
                        Last Companion App Ping: {latestPing.latitude}, {latestPing.longitude} (
                        {new Date(latestPing.recorded_at).toLocaleString()})
                      </span>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t flex gap-3">
                    {dev.status === "clean" ? (
                      <button
                        onClick={() => setReportingDevice(dev)}
                        className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" /> Report Stolen / Lost
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold text-center">
                        Public Theft Blacklist Active — Buyers Warned
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {reportingDevice && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6" /> Blacklist {reportingDevice.brand}{" "}
                {reportingDevice.model}
              </h3>
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Incident Type</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as "stolen" | "lost")}
                    className="w-full p-2.5 border rounded-xl"
                  >
                    <option value="stolen">Stolen / Snatched</option>
                    <option value="lost">Misplaced / Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Where did it happen? (District / Area) *
                  </label>
                  <input
                    required
                    placeholder="e.g. Kampala Central, Kira Road"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Police SD / CRB Reference Number (Optional)
                  </label>
                  <input
                    placeholder="e.g. SD REF 24/11/2026"
                    value={policeRef}
                    onChange={(e) => setPoliceRef(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Incident Details</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the theft happened..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingDevice(null)}
                    className="flex-1 py-2.5 border rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold"
                  >
                    Activate Theft Alert
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
