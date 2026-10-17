import React, { useState, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon, Minus, Eye, Edit3
} from 'lucide-react';
import { YoutubeIcon } from '../common/SocialIcons';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (openTag: string, closeTag: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    const text = value || '';

    if (!textarea) {
      onChange(text + `${openTag}${defaultText}${closeTag}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const textToInsert = selectedText || defaultText;
    const replacement = `${openTag}${textToInsert}${closeTag}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onChange(newText);

    // Restore focus and cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + openTag.length + textToInsert.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handleHeadingSelect = (headingTag: string) => {
    if (!headingTag) return;
    if (headingTag === 'p') {
      insertAtCursor('<p>', '</p>', 'Paragraph text');
    } else {
      const hNum = headingTag.toUpperCase();
      insertAtCursor(`<${headingTag}>`, `</${headingTag}>`, `${hNum} Heading`);
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') 
      ? linkUrl 
      : `https://${linkUrl}`;
    
    const textToShow = linkText.trim() || formattedUrl;
    const linkHtml = `<a href="${formattedUrl}" class="text-sky-600 underline font-semibold hover:text-sky-700" target="_blank" rel="noopener noreferrer">${textToShow}</a>`;
    
    insertAtCursor(linkHtml, '', '');
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    const imgHtml = `\n<figure class="my-6">\n  <img src="${imageUrl.trim()}" alt="${imageAlt.trim() || 'Article image'}" class="w-full rounded-2xl shadow-lg border border-slate-200" />\n  ${imageAlt.trim() ? `<figcaption class="text-xs text-center text-slate-500 mt-2">${imageAlt.trim()}</figcaption>` : ''}\n</figure>\n`;
    
    insertAtCursor(imgHtml, '', '');
    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    let videoId = youtubeUrl.trim();
    const watchMatch = videoId.match(/(?:v=|\/embed\/|\/1080\/|youtu\.be\/|\/v\/|\/e\/|watch\?.*v=)([^#&?]*)/);
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
    }

    const ytHtml = `\n<div class="aspect-video w-full rounded-2xl overflow-hidden my-6 shadow-lg border border-slate-200">\n  <iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n</div>\n`;
    
    insertAtCursor(ytHtml, '', '');
    setYoutubeUrl('');
    setShowYoutubeModal(false);
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm space-y-0">
      
      {/* Top Bar: Tabs & Main Controls */}
      <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'edit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-600" /> Edit Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Live Preview
          </button>
        </div>

        <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
          {value ? `${value.length} characters` : 'WordPress-Style Article Editor'}
        </span>
      </div>

      {activeTab === 'edit' ? (
        <>
          {/* WordPress-Style Editor Toolbar */}
          <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex flex-wrap items-center gap-1.5">
            
            {/* Heading Dropdown (H1 - H6, Paragraph) */}
            <div className="flex items-center gap-1">
              <Heading className="w-4 h-4 text-slate-500" />
              <select
                onChange={(e) => {
                  handleHeadingSelect(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 cursor-pointer"
                title="Select Heading Level (H1-H6)"
              >
                <option value="" disabled>Headings / Paragraph</option>
                <option value="p">Paragraph (&lt;p&gt;)</option>
                <option value="h1">Heading 1 (&lt;h1&gt;)</option>
                <option value="h2">Heading 2 (&lt;h2&gt;)</option>
                <option value="h3">Heading 3 (&lt;h3&gt;)</option>
                <option value="h4">Heading 4 (&lt;h4&gt;)</option>
                <option value="h5">Heading 5 (&lt;h5&gt;)</option>
                <option value="h6">Heading 6 (&lt;h6&gt;)</option>
              </select>
            </div>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Quick H1, H2, H3 Buttons */}
            <button
              type="button"
              onClick={() => insertAtCursor('<h1>', '</h1>', 'Heading 1')}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-bold text-xs"
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('<h2>', '</h2>', 'Heading 2')}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-bold text-xs"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('<h3>', '</h3>', 'Heading 3')}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-bold text-xs"
              title="Heading 3"
            >
              H3
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Formatting: Bold, Italic, Underline, Strikethrough */}
            <button
              type="button"
              onClick={() => insertAtCursor('<strong>', '</strong>', 'bold text')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('<em>', '</em>', 'italic text')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('<u>', '</u>', 'underlined text')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('<s>', '</s>', 'strikethrough text')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Lists & Quotes */}
            <button
              type="button"
              onClick={() => insertAtCursor('<ul>\n  <li>', '</li>\n  <li>List item 2</li>\n</ul>', 'List item 1')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('<ol>\n  <li>', '</li>\n  <li>Numbered item 2</li>\n</ol>', 'Numbered item 1')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('<blockquote class="border-l-4 border-sky-500 pl-4 italic text-slate-600 my-4">\n  ', '\n</blockquote>', 'Quote text here')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Quote Block"
            >
              <Quote className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('<hr class="my-6 border-slate-200" />\n', '', '')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 text-slate-700"
              title="Horizontal Divider"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            {/* Link, Image URL & YouTube Embed Modals */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              title="Insert Hyperlink"
            >
              <LinkIcon className="w-4 h-4" /> Link
            </button>

            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-600 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              title="Insert Image URL"
            >
              <ImageIcon className="w-4 h-4" /> Image URL
            </button>

            <button
              type="button"
              onClick={() => setShowYoutubeModal(true)}
              className="p-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              title="Embed YouTube Video"
            >
              <YoutubeIcon className="w-4 h-4" /> YouTube Video
            </button>
          </div>

          {/* Main Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={16}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write or paste article HTML content here. Select any text and click H1-H6, Bold, Bullet List, Link, Image, or YouTube Video..."
            className="w-full p-4 text-slate-900 text-sm font-mono focus:outline-none resize-y min-h-[320px]"
          />

          {/* Modal: Hyperlink */}
          {showLinkModal && (
            <form onSubmit={handleAddLink} className="p-4 bg-emerald-50/60 border-t border-emerald-200 space-y-3">
              <h4 className="text-xs font-bold text-emerald-900 uppercase">Insert Web Link</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL (e.g. https://example.com)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                  required
                />
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Display Link Text (Optional)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700">
                  Insert Link
                </button>
                <button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Modal: Image URL */}
          {showImageModal && (
            <form onSubmit={handleAddImage} className="p-4 bg-sky-50/60 border-t border-sky-200 space-y-3">
              <h4 className="text-xs font-bold text-sky-900 uppercase">Insert Image URL</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://i.postimg.cc/..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                  autoFocus
                  required
                />
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Image Alt text / Caption"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-sm hover:bg-sky-700">
                  Insert Image
                </button>
                <button type="button" onClick={() => setShowImageModal(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Modal: YouTube Video */}
          {showYoutubeModal && (
            <form onSubmit={handleAddYoutube} className="p-4 bg-red-50/60 border-t border-red-200 space-y-3">
              <h4 className="text-xs font-bold text-red-900 uppercase">Insert YouTube Video URL</h4>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-red-500"
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-sm hover:bg-red-700">
                  Embed Video
                </button>
                <button type="button" onClick={() => setShowYoutubeModal(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        /* Live Article Preview Tab */
        <div className="p-6 bg-slate-50 min-h-[350px]">
          <div className="max-w-none">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-600" /> Article Live Preview Output
            </h4>
            {value ? (
              <div
                className="article-content bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                No article content written yet. Switch back to "Edit Editor" to start typing.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
