"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Smartphone, Laptop, UploadCloud, CheckCircle2 } from "lucide-react";

export default function RegisterDevicePage() {
  const [deviceType, setDeviceType] = useState<"phone" | "laptop">("phone");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in first to register a device.");
        window.location.href = "/login";
        return;
      }

      let receiptPath = "";
      let idPath = "";

      if (receiptFile) {
        const fileName = `${user.id}/receipt-${Date.now()}-${receiptFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("evidence_vault")
          .upload(fileName, receiptFile);
        if (upErr) throw upErr;
        receiptPath = fileName;
      }

      if (idFile) {
        const fileName = `${user.id}/id-${Date.now()}-${idFile.name}`;
        const { error: idErr } = await supabase.storage
          .from("evidence_vault")
          .upload(fileName, idFile);
        if (idErr) throw idErr;
        idPath = fileName;
      }

      const { error: insertError } = await supabase.from("devices").insert({
        owner_id: user.id,
        device_type: deviceType,
        brand,
        model,
        color,
        imei_1: deviceType === "phone" ? imei1.trim() : null,
        imei_2: deviceType === "phone" && imei2 ? imei2.trim() : null,
        serial_number: serialNumber.trim() || null,
        receipt_url: receiptPath,
        national_id_url: idPath,
        status: "clean",
      });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "Error registering device.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Device Registered!</h2>
          <p className="text-slate-600 mt-2 text-sm">
            Your {brand} {model} is now protected on The Motivation Center Uganda — Global Phone Trace registry.
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-block w-full py-3 rounded-xl bg-slate-900 text-white font-semibold"
          >
            Go to My Devices Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
          The Motivation Center Uganda
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-6">
          Register Your Phone or Laptop
        </h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setDeviceType("phone")}
            className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-semibold ${
              deviceType === "phone"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <Smartphone className="w-5 h-5" /> Mobile Phone
          </button>
          <button
            type="button"
            onClick={() => setDeviceType("laptop")}
            className={`p-4 rounded-xl border flex items-center justify-center gap-2 font-semibold ${
              deviceType === "laptop"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <Laptop className="w-5 h-5" /> Laptop / PC
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand *</label>
              <input
                required
                placeholder="e.g. Samsung, Apple, Tecno, HP"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-3 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                required
                placeholder="e.g. Galaxy S24, iPhone 15, EliteBook"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-3 border rounded-xl"
              />
            </div>
          </div>

          {deviceType === "phone" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Primary IMEI 1 (Dial *#06#) *
                </label>
                <input
                  required
                  maxLength={17}
                  placeholder="15-digit IMEI 1"
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value)}
                  className="w-full p-3 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary IMEI 2 (Dual SIM)</label>
                <input
                  maxLength={17}
                  placeholder="Optional 15-digit IMEI 2"
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value)}
                  className="w-full p-3 border rounded-xl font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {deviceType === "laptop" ? "Laptop Serial Number *" : "Device Serial Number"}
              </label>
              <input
                required={deviceType === "laptop"}
                placeholder="Serial Number on box/back"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full p-3 border rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color & Physical Marks</label>
              <input
                placeholder="e.g. Phantom Black, small scratch"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full p-3 border rounded-xl"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              Proof of Ownership Documents (Stored Securely for Police Verification)
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Purchase Receipt / Box Photo *
              </label>
              <input
                required
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Owner National ID / Passport *
              </label>
              <input
                required
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50"
          >
            {loading ? "Encrypting & Saving Record..." : "Register Device Now"}
          </button>
        </form>
      </div>
    </div>
  );
}
