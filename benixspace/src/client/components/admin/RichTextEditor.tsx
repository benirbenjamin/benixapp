import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Trash2,
  Code,
  Eye,
  Check,
  X,
  Sparkles,
  Crop,
  ZoomIn
} from 'lucide-react';
import { YoutubeIcon } from '../common/SocialIcons';
import { getAuthToken } from '../../services/api';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual');
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Selected Image Element for Inline Controls (Zoom, Alignment, Aspect Crop)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageWidthPct, setImageWidthPct] = useState<number>(100);
  const [imageAlignment, setImageAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [imageAspect, setImageAspect] = useState<'auto' | '16/9' | '4/3' | '1/1'>('auto');

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);

  // Synchronize initial or external value into editor without resetting user typing
  useEffect(() => {
    if (editorRef.current && activeTab === 'visual') {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '<p><br></p>';
      }
    }
  }, [value, activeTab]);

  const handleVisualInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRangeRef.current);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    handleVisualInput();
  };

  const handleHeadingSelect = (tag: string) => {
    editorRef.current?.focus();
    restoreSelection();
    if (tag === 'p') {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }
    handleVisualInput();
  };

  // Computer Image Upload & Canvas Compression Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          // Compress on client
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const base64Data = canvas.toDataURL('image/jpeg', 0.85);

          // Upload to server endpoint /api/upload/article-media
          let finalUrl = base64Data;
          try {
            const token = getAuthToken();
            const res = await fetch('/api/upload/article-media', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ imageBase64: base64Data, filename: file.name })
            });
            const data = await res.json();
            if (data.success && data.url) {
              finalUrl = data.url;
            }
          } catch {
            // Keep base64Data as reliable fallback
          }

          // Insert image figure directly at cursor
          insertImageFigure(finalUrl, file.name.split('.')[0] || 'Article image');
          setUploadingImage(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingImage(false);
      alert(err.message || 'Error processing image.');
    }
  };

  const insertImageFigure = (url: string, captionText: string = '') => {
    editorRef.current?.focus();
    restoreSelection();

    const figureHtml = `
      <figure class="article-media-block my-6 text-center select-none" style="display: block; margin-left: auto; margin-right: auto; max-width: 100%; width: 100%; clear: both;">
        <img
          src="${url}"
          alt="${captionText}"
          class="article-interactive-media rounded-2xl shadow-lg border border-slate-200 transition-all cursor-pointer inline-block"
          style="width: 100%; height: auto; max-width: 100%; object-fit: cover; display: inline-block;"
        />
        <figcaption class="text-xs text-slate-500 mt-2 font-medium italic" contenteditable="true">
          ${captionText || 'Click to edit image caption...'}
        </figcaption>
      </figure>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, figureHtml);
    handleVisualInput();
  };

  // Click on visual editor: Detect if user clicked an embedded image to show interactive controls
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);

      // Parse width percentage
      const curWidth = img.style.width || '100%';
      const parsedPct = parseInt(curWidth) || 100;
      setImageWidthPct(parsedPct);

      // Parse alignment
      if (img.style.float === 'left') setImageAlignment('left');
      else if (img.style.float === 'right') setImageAlignment('right');
      else setImageAlignment('center');

      // Parse aspect ratio
      const aspect = (img.style.aspectRatio as any) || 'auto';
      setImageAspect(aspect);
    } else if (!target.closest('.article-media-control-toolbar')) {
      setSelectedImage(null);
    }
  };

  // Apply visual Zoom / Size to selected image
  const handleApplyWidth = (pct: number) => {
    if (!selectedImage) return;
    setImageWidthPct(pct);
    selectedImage.style.width = `${pct}%`;
    const parentFigure = selectedImage.closest('figure');
    if (parentFigure && imageAlignment === 'center') {
      parentFigure.style.width = `${pct}%`;
      parentFigure.style.marginLeft = 'auto';
      parentFigure.style.marginRight = 'auto';
    }
    handleVisualInput();
  };

  // Apply visual Alignment to selected image
  const handleApplyAlignment = (align: 'left' | 'center' | 'right') => {
    if (!selectedImage) return;
    setImageAlignment(align);
    const parentFigure = selectedImage.closest('figure');

    if (align === 'left') {
      selectedImage.style.float = 'left';
      selectedImage.style.margin = '0 24px 20px 0';
      selectedImage.style.display = 'inline-block';
      if (parentFigure) {
        parentFigure.style.float = 'left';
        parentFigure.style.margin = '0 24px 20px 0';
        parentFigure.style.clear = 'none';
        parentFigure.style.width = `${imageWidthPct > 60 ? 50 : imageWidthPct}%`;
      }
    } else if (align === 'right') {
      selectedImage.style.float = 'right';
      selectedImage.style.margin = '0 0 20px 24px';
      selectedImage.style.display = 'inline-block';
      if (parentFigure) {
        parentFigure.style.float = 'right';
        parentFigure.style.margin = '0 0 20px 24px';
        parentFigure.style.clear = 'none';
        parentFigure.style.width = `${imageWidthPct > 60 ? 50 : imageWidthPct}%`;
      }
    } else {
      selectedImage.style.float = 'none';
      selectedImage.style.margin = '16px auto';
      selectedImage.style.display = 'inline-block';
      if (parentFigure) {
        parentFigure.style.float = 'none';
        parentFigure.style.marginLeft = 'auto';
        parentFigure.style.marginRight = 'auto';
        parentFigure.style.clear = 'both';
        parentFigure.style.width = `${imageWidthPct}%`;
      }
    }
    handleVisualInput();
  };

  // Apply aspect ratio crop
  const handleApplyAspect = (ratio: 'auto' | '16/9' | '4/3' | '1/1') => {
    if (!selectedImage) return;
    setImageAspect(ratio);
    selectedImage.style.aspectRatio = ratio;
    selectedImage.style.objectFit = 'cover';
    handleVisualInput();
  };

  // Delete selected image
  const handleDeleteSelectedImage = () => {
    if (!selectedImage) return;
    const parentFigure = selectedImage.closest('figure');
    if (parentFigure) {
      parentFigure.remove();
    } else {
      selectedImage.remove();
    }
    setSelectedImage(null);
    handleVisualInput();
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
      ? linkUrl
      : `https://${linkUrl}`;
    const textToShow = linkText.trim() || formattedUrl;
    const linkHtml = `<a href="${formattedUrl}" class="text-sky-600 underline font-semibold hover:text-sky-700" target="_blank" rel="noopener noreferrer">${textToShow}</a>`;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, linkHtml);
    handleVisualInput();
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    let videoId = youtubeUrl.trim();
    const watchMatch = videoId.match(/(?:v=|\/embed\/|\/1080\/|youtu\.be\/|\/v\/|\/e\/|watch\?.*v=)([^#&?]*)/);
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
    }

    const ytHtml = `
      <div class="aspect-video w-full rounded-2xl overflow-hidden my-6 shadow-lg border border-slate-200">
        <iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <p><br></p>
    `;

    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, ytHtml);
    handleVisualInput();
    setYoutubeUrl('');
    setShowYoutubeModal(false);
  };

  return (
    <div className="border border-slate-300 rounded-3xl overflow-hidden bg-white shadow-md space-y-0 text-slate-800 font-sans">
      
      {/* Hidden File Input for Computer Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Top Main Navigation Bar: Visual WordPress Editor / HTML Code / Live Preview */}
      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-slate-200/90 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
              activeTab === 'visual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>WordPress Visual Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-600" />
            <span>HTML / Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Article Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {uploadingImage && (
            <span className="text-xs font-bold text-purple-600 animate-pulse flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Uploading Image...</span>
            </span>
          )}
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
            WYSIWYG Live Typography
          </span>
        </div>
      </div>

      {/* WordPress-Style Visual Controls Toolbar (When in Visual Mode) */}
      {activeTab === 'visual' && (
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex flex-wrap items-center gap-1.5">
          
          {/* Visual Headings Dropdown: Renders Real Typography Live */}
          <div className="flex items-center gap-1">
            <Heading className="w-4 h-4 text-slate-500" />
            <select
              onChange={(e) => {
                handleHeadingSelect(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-purple-500 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-sm"
              title="Choose Heading Style"
            >
              <option value="" disabled>Typography / Headings</option>
              <option value="p">Paragraph (Normal Text)</option>
              <option value="h1">Heading 1 (Main Section Title)</option>
              <option value="h2">Heading 2 (Sub-heading)</option>
              <option value="h3">Heading 3 (Minor Topic)</option>
            </select>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Quick Heading Buttons */}
          <button
            type="button"
            onClick={() => handleHeadingSelect('h1')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-800 font-black text-xs shadow-sm"
            title="Format as Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => handleHeadingSelect('h2')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-800 font-bold text-xs shadow-sm"
            title="Format as Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => handleHeadingSelect('h3')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-800 font-bold text-xs shadow-sm"
            title="Format as Heading 3"
          >
            H3
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Standard Formatting: Bold, Italic, Underline */}
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleHeadingSelect('blockquote')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-purple-700 text-slate-700 shadow-sm"
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Media Actions: Computer Image Upload, YouTube, Link */}
          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              fileInputRef.current?.click();
            }}
            disabled={uploadingImage}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Upload Image from Computer Directly"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image from Computer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setShowYoutubeModal(true);
            }}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 shadow-sm"
            title="Embed YouTube Video"
          >
            <YoutubeIcon className="w-4 h-4 text-rose-600" />
          </button>

          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setShowLinkModal(true);
            }}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700 shadow-sm"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Inline Media Control Toolbar: Appears when an Image is Clicked */}
      {selectedImage && activeTab === 'visual' && (
        <div className="article-media-control-toolbar bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3 border-y border-purple-500/40 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-amber-300 flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Image Controls:</span>
            </span>

            {/* Width / Zoom Slider & Presets */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-300 font-bold">Zoom:</label>
              <input
                type="range"
                min="25"
                max="100"
                step="5"
                value={imageWidthPct}
                onChange={(e) => handleApplyWidth(Number(e.target.value))}
                className="w-24 accent-purple-400 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-purple-300 font-bold w-9">{imageWidthPct}%</span>

              <div className="flex items-center gap-1">
                {[25, 50, 75, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyWidth(preset)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      imageWidthPct === preset
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset === 100 ? 'Full' : `${preset}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            {/* Alignment Options */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-slate-300 font-bold mr-1">Align:</label>
              <button
                type="button"
                onClick={() => handleApplyAlignment('left')}
                className={`p-1 rounded-lg ${imageAlignment === 'left' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Align Left (Wrap Text)"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleApplyAlignment('center')}
                className={`p-1 rounded-lg ${imageAlignment === 'center' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Align Center (Block)"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleApplyAlignment('right')}
                className={`p-1 rounded-lg ${imageAlignment === 'right' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Align Right (Wrap Text)"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            {/* Aspect Ratio / Crop Options */}
            <div className="flex items-center gap-1">
              <Crop className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[11px] text-slate-300 font-bold mr-1">Crop:</label>
              {(['auto', '16/9', '4/3', '1/1'] as const).map((asp) => (
                <button
                  key={asp}
                  type="button"
                  onClick={() => handleApplyAspect(asp)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    imageAspect === asp
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {asp === 'auto' ? 'Natural' : asp}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteSelectedImage}
              className="p-1.5 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
              title="Delete Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Close Toolbar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 1: WordPress Visual Editor (Typography Renders Live Without Tags) */}
      {activeTab === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleVisualInput}
          onClick={handleEditorClick}
          onBlur={saveCurrentSelection}
          className="min-h-[460px] p-6 focus:outline-none text-slate-800 prose prose-slate max-w-none prose-h1:text-3xl prose-h1:font-black prose-h1:text-slate-900 prose-h1:mb-3 prose-h2:text-2xl prose-h2:font-extrabold prose-h2:text-slate-800 prose-h2:mb-2.5 prose-h3:text-xl prose-h3:font-bold prose-h3:text-slate-800 prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-700 prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic"
          style={{ wordBreak: 'break-word' }}
        />
      )}

      {/* Mode 2: HTML / Code Mode */}
      {activeTab === 'code' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          placeholder="Type raw HTML markup here..."
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 focus:outline-none resize-y min-h-[460px]"
        />
      )}

      {/* Mode 3: Live Article Preview */}
      {activeTab === 'preview' && (
        <div className="p-6 bg-slate-50 min-h-[460px] overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full mb-3 inline-block">
              Published View Rendering
            </span>
            <div
              className="prose prose-slate max-w-none prose-h1:text-3xl prose-h1:font-black prose-h2:text-2xl prose-h2:font-bold prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">No content written yet.</p>' }}
            />
          </div>
        </div>
      )}

      {/* YouTube Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <YoutubeIcon className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-sm text-slate-900">Embed YouTube Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowYoutubeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddYoutube} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube URL or Video ID</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-rose-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYoutubeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  Insert Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-sm text-slate-900">Insert Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Text (optional)</label>
                <input
                  type="text"
                  placeholder="Click here"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
