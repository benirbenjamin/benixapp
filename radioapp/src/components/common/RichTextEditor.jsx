import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube,
  Undo,
  Redo,
} from 'lucide-react';

export function RichTextEditor({ value, onChange, placeholder = 'Write your article story here...' }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter destination URL:');
    if (url) {
      exec('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter direct image URL (e.g. from Postimages):');
    if (url) {
      exec('insertImage', url);
    }
  };

  const insertYouTube = () => {
    const url = prompt('Enter YouTube Video URL:');
    if (url) {
      const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regExp);
      if (match && match[1]) {
        const embedHtml = `<div class="aspect-video my-4 rounded-xl overflow-hidden shadow-lg"><iframe class="w-full h-full" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe></div><p><br></p>`;
        exec('insertHTML', embedHtml);
      } else {
        alert('Could not parse YouTube video ID.');
      }
    }
  };

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200">
        <button
          type="button"
          onClick={() => exec('undo')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('redo')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('formatBlock', '<h1>')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h2>')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h3>')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<p>')}
          className="px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          title="Paragraph"
        >
          P
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<blockquote>')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('justifyLeft')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyCenter')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyRight')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-300 mx-1"></span>

        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
          title="Insert Image by URL"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertYouTube}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-red-600 hover:text-red-700 transition-colors"
          title="Embed YouTube Video"
        >
          <Youtube className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[280px] max-h-[500px] overflow-y-auto focus:outline-none rich-text text-slate-800 leading-relaxed text-sm sm:text-base"
        data-placeholder={placeholder}
      />
    </div>
  );
}
