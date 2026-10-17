"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Video,
  Image as ImageIcon,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Shield,
  Tag as TagIcon,
  Globe,
  Film,
  RefreshCw,
  Layers,
  Check,
  X,
  Play,
  Clock,
  HardDrive,
  FileVideo,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { useApp } from "@/components/providers/AppProviders";

const DEFAULT_RWANDA_CATEGORIES = [
  { id: "gospel", name: "Gospel & Choirs (Indirimbo zo Guhimbaza)" },
  { id: "cinema", name: "Rwandan Cinema & Comedy (Filime Nyarwanda)" },
  { id: "music", name: "Music & Culture (Indirimbo n'Umuco)" },
  { id: "tech", name: "Tech & Innovation (Ikoranabuhanga)" },
  { id: "business", name: "Business & Entrepreneurship (Ubucuruzi)" },
  { id: "education", name: "Education & Tutorials (Inyigisho)" },
  { id: "sports", name: "Sports & Fitness (Imikino)" },
  { id: "news", name: "News & Documentaries (Amakuru na Documentaire)" },
];

const SUGGESTED_TAGS = [
  "RwandaGospel",
  "KigaliMusic",
  "RwandaCinema",
  "UmuguziPro",
  "Ikinyarwanda",
  "VisitRwanda",
  "KigaliLife",
  "EastAfricaHits",
];

export default function StudioUploadPage() {
  const router = useRouter();
  const { user, siteSettings } = useApp();

  // Basic Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("180");
  const [accessType, setAccessType] = useState<"PUBLIC" | "PRIVATE" | "PREMIUM">("PUBLIC");
  const [price, setPrice] = useState("1000");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>(DEFAULT_RWANDA_CATEGORIES);

  // SEO & Tags
  const [tags, setTags] = useState<string[]>(["Rwanda", "UmuguziPro"]);
  const [tagInput, setTagInput] = useState("");

  // Upload States
  const [videoSourceMode, setVideoSourceMode] = useState<"file" | "url">("file");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState<string>("");
  const [uploadDriveAccount, setUploadDriveAccount] = useState<string>("Google Drive Multi-Cloud");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch video categories from API
    fetch("/api/categories?type=VIDEO")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        // Fall back to default Rwandan categories
      });
  }, []);

  // Handle Video File Upload via Google Drive / Cloud API
  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    // Detect duration using client-side video metadata
    try {
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.src = URL.createObjectURL(file);
      tempVideo.onloadedmetadata = () => {
        if (tempVideo.duration && !isNaN(tempVideo.duration)) {
          setDuration(Math.round(tempVideo.duration).toString());
        }
        URL.revokeObjectURL(tempVideo.src);
      };
    } catch {
      // Ignore duration inspection error
    }

    setUploadingFile(true);
    setUploadProgress(15);
    setError("");
    setUploadFileName(file.name);
    setUploadFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");

    // Suggest title from filename if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulated progressive upload steps
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 12 : prev));
      }, 350);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video upload failed");

      setUploadProgress(100);
      setVideoUrl(data.url);
      if (data.provider === "GOOGLE_DRIVE") {
        setUploadDriveAccount("Google Drive Cascading Pool");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload video file.");
      setUploadProgress(0);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle Thumbnail File Upload
  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;
    setUploadingThumbnail(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thumbnail upload failed");

      setThumbnailUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload thumbnail.");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Tag Helpers
  const addTag = (newTag: string) => {
    const cleaned = newTag.trim().replace(/^#/, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Video URL Auto-detect for YouTube
  const handleVideoUrlChange = (val: string) => {
    setVideoUrl(val);
    const ytMatch = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1] && !thumbnailUrl) {
      setThumbnailUrl(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
    }
  };

  // Form Submit
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setError("Please provide a video title and upload a video file or provide a video URL.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/videos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim() || null,
          duration: Number(duration) || 180,
          accessType,
          price: accessType === "PREMIUM" ? Number(price) || 0 : 0,
          categoryId: categoryId || null,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish video");

      setSuccess(true);
      setTimeout(() => {
        router.push(`/video/${data.video.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to publish video");
    } finally {
      setSubmitting(false);
    }
  };

  // Earnings calculation for Pay-Per-View
  const numPrice = Number(price) || 0;
  const platformRate = Number(siteSettings?.commission_rate) || 10;
  const creatorEarnings = Math.max(0, Math.round(numPrice * (1 - platformRate / 100)));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-black uppercase tracking-wider">
              Creator Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <HardDrive className="w-3 h-3" />
              Google Drive Multi-Drive Cloud Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Upload &amp; Monetize Content
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish videos across Rwanda and global audiences with Google In-Stream Ads or Pay-Per-View monetization.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Video Published Successfully!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your video has been encoded and registered on Umuguzipro. Viewers can now discover, stream, or unlock your content.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-brand animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to video player...
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column: Details, Upload & Monetization */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Video File / Cloud Upload Zone */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-brand font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Video Source &amp; Google Drive Upload
                  </h3>
                </div>

                {/* Source Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode("file")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      videoSourceMode === "file" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Direct File (Cloud)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode("url")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      videoSourceMode === "url" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    YouTube / External Link
                  </button>
                </div>
              </div>

              {videoSourceMode === "file" ? (
                <div>
                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleVideoUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all relative overflow-hidden ${
                      isDragOver
                        ? "border-brand bg-blue-50/60 scale-[1.01]"
                        : videoUrl
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-300 hover:border-brand hover:bg-slate-50/60"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/mkv,video/avi"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                      }}
                      className="hidden"
                    />

                    {uploadingFile ? (
                      <div className="space-y-4 py-3">
                        <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto animate-pulse">
                          <Loader2 className="w-7 h-7 animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Uploading to Google Drive Multi-Drive Cloud...
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {uploadFileName} ({uploadFileSize}) • Cascading Failover Protected
                          </p>
                        </div>
                        {/* Progress Bar */}
                        <div className="max-w-md mx-auto space-y-1.5">
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand transition-all duration-300 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>Processing video stream</span>
                            <span>{uploadProgress}%</span>
                          </div>
                        </div>
                      </div>
                    ) : videoUrl ? (
                      <div className="space-y-2 py-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">
                            Video Uploaded to Cloud Storage
                          </p>
                          <p className="text-xs text-emerald-700 font-mono break-all mt-0.5 max-w-lg mx-auto">
                            {uploadFileName || videoUrl}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800 shadow-2xs">
                            {uploadDriveAccount}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="text-[11px] font-bold text-brand hover:underline"
                          >
                            Replace File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand flex items-center justify-center mx-auto shadow-2xs">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Drag &amp; drop video file here, or <span className="text-brand">browse</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Supports MP4, WebM, MOV up to 10GB • Multi-Drive Auto-Failover Enabled
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            1080p / 4K HD
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-brand px-2 py-0.5 rounded">
                            Google Drive Storage
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    YouTube Embed URL or Direct MP4 Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or direct .mp4 link"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Paste any YouTube video link to showcase in your channel or test Rwandan sample songs. The thumbnail will be automatically detected!
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Metadata & Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-brand font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Video Metadata &amp; Rwandan Categorization
                </h3>
              </div>

              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Video Title *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{title.length} / 120</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Israel Mbonyi - Nina Siri Live in Kigali (Official Video)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Content Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Duration (Seconds)
                    </label>
                    <span className="text-[11px] font-bold text-brand font-mono">
                      {formatDuration(Number(duration) || 0)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 240"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Google SEO Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Google SEO &amp; Discovery Tags
                </label>
                <div className="p-2.5 rounded-2xl border border-slate-300 focus-within:ring-2 focus-within:ring-brand flex flex-wrap items-center gap-1.5 bg-slate-50/50">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-brand text-xs font-bold"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type keyword &amp; press Enter..."
                    className="flex-1 min-w-[140px] px-2 py-1 text-xs bg-transparent focus:outline-none"
                  />
                </div>

                {/* Suggested Tags Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Suggested:
                  </span>
                  {SUGGESTED_TAGS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => addTag(st)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                        tags.includes(st)
                          ? "bg-slate-200 text-slate-400 cursor-default"
                          : "bg-slate-100 hover:bg-brand/10 hover:text-brand text-slate-600"
                      }`}
                      disabled={tags.includes(st)}
                    >
                      +{st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description &amp; Credits
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your video, lyrics, social links, director credits, and hashtags..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand leading-relaxed"
                />
              </div>

              {/* Thumbnail Image */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thumbnail Image (Custom or Auto-Generated)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://... or upload custom artwork"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleThumbnailUpload(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-brand" />
                    <span>{uploadingThumbnail ? "Uploading..." : "Upload Artwork"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: Monetization & Access Controls */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-brand font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Monetization &amp; Access Controls
                </h3>
              </div>

              {/* Access Type Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Public Free + Ads */}
                <div
                  onClick={() => setAccessType("PUBLIC")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    accessType === "PUBLIC"
                      ? "border-brand bg-blue-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="w-5 h-5 text-brand" />
                    {accessType === "PUBLIC" && (
                      <span className="w-2 h-2 rounded-full bg-brand"></span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">Public (Free + Ads)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Open to all viewers. Earn ad revenue via Google In-Stream Video Ads.
                  </p>
                </div>

                {/* 2. Premium Pay-Per-View */}
                <div
                  onClick={() => setAccessType("PREMIUM")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    accessType === "PREMIUM"
                      ? "border-amber-500 bg-amber-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    {accessType === "PREMIUM" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">Pay-Per-View</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Require viewers to pay in RWF via MoMo or Card before watching.
                  </p>
                </div>

                {/* 3. Private */}
                <div
                  onClick={() => setAccessType("PRIVATE")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    accessType === "PRIVATE"
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Lock
                      className={`w-5 h-5 ${
                        accessType === "PRIVATE" ? "text-white" : "text-slate-600"
                      }`}
                    />
                    {accessType === "PRIVATE" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs">Private</h4>
                  <p
                    className={`text-[11px] mt-1 leading-snug ${
                      accessType === "PRIVATE" ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Only you and authorized members can view this video.
                  </p>
                </div>
              </div>

              {/* Public Ad-Monetization Details */}
              {accessType === "PUBLIC" && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <h4 className="font-extrabold text-xs text-purple-950">
                      Google In-Stream Video Ads Monetization
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-slate-500 block">Pre-Roll Ad</span>
                      <span className="text-xs font-black text-slate-900">At 15s</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-slate-500 block">Mid-Roll Break</span>
                      <span className="text-xs font-black text-slate-900">Every 5 mins</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-slate-500 block">Creator View Rate</span>
                      <span className="text-xs font-black text-emerald-600">3 RWF / view</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-slate-500 block">Ad Click Bonus</span>
                      <span className="text-xs font-black text-emerald-600">4 RWF / click</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    Earnings are credited directly to your creator balance once reaching <strong>30 Subscribers</strong> and <strong>300 Watch Hours</strong>.
                  </p>
                </div>
              )}

              {/* Premium Pay-Per-View Controls */}
              {accessType === "PREMIUM" && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <h4 className="font-extrabold text-xs text-amber-950">
                      Pay-Per-View Pricing &amp; Net Earnings
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Unlock Price (RWF) *
                      </label>
                      <input
                        type="number"
                        required
                        min={100}
                        step={50}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Platform Fee ({platformRate}%):</span>
                        <span className="font-semibold text-slate-700 font-mono">
                          {formatCurrency(numPrice - creatorEarnings)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 mt-1">
                        <span className="font-bold text-emerald-900">Your Net Payout:</span>
                        <span className="font-black text-emerald-600 font-mono text-sm">
                          {formatCurrency(creatorEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/70 rounded-xl text-[11px] text-amber-800 space-y-1">
                    <p className="font-bold">🔒 Anti-Piracy Protection Active:</p>
                    <p>
                      Direct media streams and source downloads are encrypted and locked. Viewers can unlock seamlessly with MTN Mobile Money, Airtel Money, or Debit Cards via Flutterwave.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || uploadingFile}
                className="w-full py-4 bg-brand hover:bg-brand-hover text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Publishing Video &amp; Registering on Umuguzipro...</span>
                  </>
                ) : (
                  <>
                    <span>Publish to Umuguzipro</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Card Preview & Cloud Storage Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Live Studio Preview
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  16:9 Aspect
                </span>
              </div>

              {/* Realistic Video Card */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-xs group">
                <div className="relative aspect-video bg-slate-800 flex items-center justify-center overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={title || "Video preview"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <Film className="w-8 h-8 text-slate-500 mx-auto" />
                      <span className="text-xs text-slate-400 font-medium block">
                        Thumbnail will appear here
                      </span>
                    </div>
                  )}

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-xs rounded text-[11px] font-bold font-mono text-white">
                    {formatDuration(Number(duration) || 0)}
                  </div>

                  {/* Access Level Badge */}
                  <div className="absolute top-2 left-2">
                    {accessType === "PUBLIC" && (
                      <span className="px-2 py-0.5 rounded bg-brand/90 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider">
                        Free • Ads
                      </span>
                    )}
                    {accessType === "PREMIUM" && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/95 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider">
                        {formatCurrency(Number(price) || 0)}
                      </span>
                    )}
                    {accessType === "PRIVATE" && (
                      <span className="px-2 py-0.5 rounded bg-slate-800/90 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 space-y-2 bg-slate-900">
                  <h4 className="font-bold text-xs text-white line-clamp-2 leading-snug">
                    {title || "Your Catchy Video Title Here..."}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center">
                      {user?.displayName ? user.displayName.charAt(0) : "U"}
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium truncate">
                      {user?.displayName || "Your Channel"}
                    </span>
                  </div>

                  {/* Tag preview */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] text-blue-400 font-medium">
                          #{t}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-[10px] text-slate-500">+{tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Cloud Architecture Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <HardDrive className="w-4 h-4 text-brand" />
                  <span>Cloud Multi-Drive Engine</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Google Drive Cascading:</span>
                    <span className="font-bold text-emerald-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-Failover on Quota:</span>
                    <span className="font-bold text-slate-900">Instant</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Permanent OAuth Refresh:</span>
                    <span className="font-bold text-slate-900">Active</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  When Drive #1 is full, video uploads cascade automatically to Drive #2 and #3.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
