"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Search, Smartphone, Lock, FileCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type DeviceResult = {
  brand: string;
  model: string;
  status: "clean" | "lost" | "stolen" | "under_review" | "recovered";
  case_ref?: string;
};

export default function Home() {
  const [imei, setImei] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeviceResult | "not_found" | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const cleanedImei = imei.trim();
    if (cleanedImei.length < 8) {
      setError("Please enter a valid 15-digit IMEI number (Dial *#06# on the phone) or Laptop Serial.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: dbError } = await supabase.rpc("public_verify_device", {
        query_str: cleanedImei,
      });

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        setResult("not_found");
      } else {
        setResult(data[0]);
      }
    } catch (err:any) {
      setError(err?.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
              The Motivation Center Uganda
            </p>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-emerald-400 w-6 h-6" />
              Global Phone Trace
            </h1>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a href="/police-portal" className="text-amber-300 hover:text-amber-200">
              Police Desk
            </a>
            <a
              href="/login"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
            >
              Owner Login
            </a>
            <a
              href="/register-device"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Register Device
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-3">
            Uganda & East Africa Anti-Theft Device Registry
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Check Any Phone or Laptop Before You Buy
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Protect yourself from buying stolen electronics. Enter the 15-digit IMEI
            (dial <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">*#06#</code>) or
            laptop serial number to verify ownership on The Motivation Center Uganda registry.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              placeholder="Enter 15-digit IMEI or Serial Number..."
              className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              {loading ? "Checking..." : "Verify Device"}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}

          {result === "not_found" && (
            <div className="mt-6 p-5 rounded-xl bg-slate-100 border border-slate-300">
              <h3 className="font-bold text-slate-800 text-lg">
                No Theft Report Found in Registry
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Identifier <span className="font-mono font-semibold">{imei}</span> is not currently
                reported stolen on Global Phone Trace. Still request original purchase receipts
                and National ID from the seller.
              </p>
            </div>
          )}

          {result && result !== "not_found" && (
            <div
              className={`mt-6 p-5 rounded-xl border ${
                result.status === "stolen" || result.status === "lost"
                  ? "bg-red-50 border-red-300 text-red-950"
                  : "bg-emerald-50 border-emerald-300 text-emerald-950"
              }`}
            >
              {result.status === "stolen" || result.status === "lost" ? (
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-lg text-red-700 uppercase">
                      Warning: Reported {result.status}
                    </h3>
                    <p className="text-sm mt-1">
                      <strong>Device:</strong> {result.brand} {result.model} <br />
                      <strong>Case Reference:</strong>{" "}
                      <span className="font-mono">{result.case_ref}</span>
                    </p>
                    <p className="text-sm mt-2 font-medium">
                      Do NOT purchase or unlock this device. Report this sighting to the nearest
                      Uganda Police station or contact The Motivation Center Uganda recovery desk.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg text-emerald-800">
                      Verified Registered Device — Status: {result.status.toUpperCase()}
                    </h3>
                    <p className="text-sm mt-1">
                      <strong>Device:</strong> {result.brand} {result.model} <br />
                      <strong>Registry ID:</strong>{" "}
                      <span className="font-mono">{result.case_ref}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <section className="grid sm:grid-cols-3 gap-6 mt-14">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <Smartphone className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-lg mb-1">1. Register & Prove Ownership</h3>
            <p className="text-sm text-slate-600">
              Link your phone or laptop IMEI/Serial number with your receipt and National ID before
              theft ever happens.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <Lock className="w-8 h-8 text-amber-600 mb-3" />
            <h3 className="font-bold text-lg mb-1">2. Instant Theft Blacklist</h3>
            <p className="text-sm text-slate-600">
              Report a stolen device in seconds. Dealers and buyers across Uganda immediately see a
              red theft warning.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <FileCheck className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-bold text-lg mb-1">3. Police & App Recovery</h3>
            <p className="text-sm text-slate-600">
              Generate an official ownership dossier for Police and track live GPS coordinates via
              our companion mobile app.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-xs py-6 text-center">
        © 2026 The Motivation Center Uganda- Global Phone Trace. All rights
        reserved.
      </footer>
    </div>
  );
}
