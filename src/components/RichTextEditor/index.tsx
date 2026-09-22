import { uploadImage } from '@/services/media';
import { message } from 'antd';
import React from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Regular function (not arrow) — Quill calls toolbar handlers with `this` bound
// to the toolbar module, giving access to `this.quill`.
function imageHandler(this: { quill: InstanceType<typeof Quill> }) {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const range = this.quill.getSelection(true);

    try {
      const base64 = await fileToBase64(file);
      const response = await uploadImage(base64);

      if (response.success && response.data?.url) {
        this.quill.insertEmbed(range.index, 'image', response.data.url, 'user');
        this.quill.setSelection(range.index + 1, 0, 'user');
      } else {
        message.error(response.message || 'آپلود تصویر ناموفق بود');
      }
    } catch {
      message.error('خطا در آپلود تصویر');
    }
  };
}

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      [{ direction: 'rtl' }],
      ['link', 'image'],
      ['clean'],
    ],
    handlers: {
      image: imageHandler,
    },
  },
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  style,
}) => {
  return (
    <div style={style}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        style={{ direction: 'rtl', minHeight: 150 }}
      />
    </div>
  );
};

export default RichTextEditor;
