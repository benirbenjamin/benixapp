"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Store, Upload, CheckCircle2, AlertCircle, ArrowLeft, Image as ImageIcon, FileText } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

export default function CreateProductPage() {
  const router = useRouter();
  const { user } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [fileType, setFileType] = useState("ZIP");
  const [fileSize, setFileSize] = useState("45 MB");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/categories?type=PRODUCT")
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
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      }
    } catch {
      setError("Failed to upload product cover image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.downloadUrl || data.url) {
        setDownloadUrl(data.downloadUrl || data.url);
        setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      }
    } catch {
      setError("Failed to upload digital asset file.");
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/products/create");
      return;
    }

    if (!title || !description || !price) {
      setError("Please complete all required fields (title, description, price).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          categoryId: categoryId || null,
          fileType,
          fileSize,
          downloadUrl: downloadUrl || "https://example.com/asset-download",
          images: imageUrl ? [imageUrl] : ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      setSuccess(true);
      setTimeout(() => {
        router.push("/products");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-brand" /> Sell a Digital Product
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              List digital downloads, software, video presets, music sample packs, and ebooks to earn directly via Mobile Money or Wallet.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Product successfully published to marketplace! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cinematic Rwanda 4K Video LUTs Pack"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (RWF) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 15000"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Set 0 for free download.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description &amp; What&apos;s Included *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your digital product, file formats included, compatibility, and license instructions..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>

              {/* Digital File Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    File Type
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-brand"
                  >
                    <option value="ZIP">ZIP Archive (Presets / Packs)</option>
                    <option value="PDF">PDF eBook / Document</option>
                    <option value="MP4">MP4 Video Course / Footage</option>
                    <option value="MP3">MP3 / WAV Audio Beats</option>
                    <option value="APP">Software / Script</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    File Size Label
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 120 MB"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Upload Asset / External Download URL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" /> Deliverable Asset File
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Upload Digital File (or Google Drive Asset)
                    </label>
                    <input
                      type="file"
                      onChange={handleAssetUpload}
                      disabled={uploadingAsset}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-black cursor-pointer"
                    />
                    {uploadingAsset && (
                      <span className="text-[11px] text-blue-600 font-semibold animate-pulse">
                        Uploading asset file...
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Or Direct Secure Download URL
                    </label>
                    <input
                      type="url"
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/uc?export=download&id=..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand" /> Product Cover / Preview Image
                </h4>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt="Product preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand file:text-white hover:file:bg-brand-hover cursor-pointer"
                    />
                    {uploadingImage && (
                      <span className="text-[11px] text-brand font-semibold animate-pulse block">
                        Uploading preview image...
                      </span>
                    )}
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>{loading ? "Publishing Product..." : "Publish to Marketplace"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
