"use client";

import dynamic from 'next/dynamic';
import { useMemo, useRef, forwardRef } from 'react';
import type ReactQuillType from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { adminMediaService } from '@/lib/api/services/admin.service';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Dynamic import with forwardRef support
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    // eslint-disable-next-line react/display-name
    return forwardRef<ReactQuillType, ReactQuillType.ReactQuillProps>((props, ref) => (
      <RQ ref={ref} {...props} />
    ));
  },
  { ssr: false }
);

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuillType>(null);

  // Image upload handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // Upload image
        const uploadedMedia = await adminMediaService.upload(file);

        // Get Quill editor instance
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        // Get cursor position
        const range = quill.getSelection(true);

        // Insert image at cursor position
        quill.insertEmbed(range.index, 'image', uploadedMedia.url);

        // Move cursor after image
        quill.setSelection(range.index + 1, 0);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Không thể tải lên ảnh. Vui lòng thử lại.');
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link',
    'image'
  ];

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
      />
    </div>
  );
};

export default RichTextEditor;
