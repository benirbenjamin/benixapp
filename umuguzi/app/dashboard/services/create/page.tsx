"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowRight, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";

export default function CreateServicePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"FIXED" | "HOURLY" | "STARTING_AT">("FIXED");
  const [location, setLocation] = useState("Kigali, Rwanda");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/categories?type=SERVICE")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId: categoryId || null,
          price: Number(price),
          priceType,
          location,
          images: imageUrl ? [imageUrl] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to list service");

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/services");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900">List a Professional Service</h1>
        <p className="text-xs text-slate-500">
          Create a service offering on the Umuguzipro Marketplace and start receiving bookings.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-10 space-y-2">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Service Successfully Listed!</h3>
            <p className="text-xs text-slate-500">Redirecting to your services dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Professional Event & Wedding Photography in Kigali"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="">Select Service Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location / Coverage Area *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kigali, Rwanda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Price (RWF) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pricing Model
                </label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="FIXED">Fixed Package Price</option>
                  <option value="HOURLY">Hourly Rate</option>
                  <option value="STARTING_AT">Starting At</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Portfolio Cover Image (URL or Upload)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or upload photo"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand font-mono text-xs"
                />
                <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                  <ImageIcon className="w-4 h-4 text-brand" />
                  <span>{uploadingImage ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Description &amp; Deliverables *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what is included in this service, equipment used, turnaround time, etc..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Creating Service..." : "Publish Service Listing"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
