import { uploadImage } from '@/services/media';
import {
  CodeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Button, Popover, message } from 'antd';
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css';
import { useLayoutEffect, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
// `blots/block` isn't a registered `Quill.import()` key (only formats/modules/themes
// explicitly passed to `Quill.register()` are) — BlockEmbed must come from Quill's
// own module directly.
import { BlockEmbed } from 'quill/blots/block';
import { EMOJIS } from './emoji';
import { SPECIAL_CHARACTERS } from './specialCharacters';
import './styles.less';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  /** Fixed height (px) of the editable area in normal (non-fullscreen) mode. */
  editorHeight?: number;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Quill format/blot/module registration (module scope, runs once) ---

// Quill's own typings return `unknown` for these dynamic `Quill.import()` keys —
// casting to `any` here matches the standard documented Quill font/size-whitelist
// and custom-blot registration pattern, which mutates/extends Quill's internals
// in ways its typings don't model.
/* eslint-disable @typescript-eslint/no-explicit-any */
const Font: any = Quill.import('formats/font');
Font.whitelist = ['yekanbakh', 'tahoma', 'arial'];
Quill.register(Font, true);

const Size: any = Quill.import('formats/size');
Size.whitelist = ['12px', '14px', '16px', '18px', '24px', '32px'];
Quill.register(Size, true);

class HorizontalRuleBlot extends BlockEmbed {
  static blotName = 'hr';
  static tagName = 'hr';
}
Quill.register(HorizontalRuleBlot);
/* eslint-enable @typescript-eslint/no-explicit-any */

Quill.register({ 'modules/table-better': QuillTableBetter }, true);

// Regular functions (not arrows) — Quill calls toolbar handlers with `this`
// bound to the toolbar module, giving access to `this.quill`.
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
        // insertEmbed goes through Quill's updateContents path internally,
        // so it's already safe for documents containing tables.
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

function horizontalRuleHandler(this: { quill: InstanceType<typeof Quill> }) {
  const range = this.quill.getSelection(true);
  this.quill.insertEmbed(range.index, 'hr', true, 'user');
  this.quill.setSelection(range.index + 1, 0, 'user');
}

const modules = {
  toolbar: {
    container: [
      [{ font: [] }, { size: [] }],
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote'],
      [{ direction: 'rtl' }],
      ['link', 'image', 'hr', 'table-better'],
      ['clean'],
    ],
    handlers: {
      image: imageHandler,
      hr: horizontalRuleHandler,
    },
  },
  table: false,
  'table-better': {
    language: 'en_US',
    menus: [
      'column',
      'row',
      'merge',
      'table',
      'cell',
      'wrap',
      'copy',
      'delete',
    ],
    toolbarTable: true,
  },
  keyboard: {
    bindings: QuillTableBetter.keyboardBindings,
  },
};

/**
 * quill-table-better's own docs: loading HTML via `quill.setContents(quill.clipboard.convert(...))`
 * (what react-quill-new's controlled `value` sync uses internally) corrupts table rendering —
 * `updateContents` is the documented safe replacement. Used both for the mount/external-value-reset
 * correction below and for the source/HTML view toggle.
 *
 * The `updateContents` call must use the `'user'` source, not `'silent'` — table-better's own
 * internal normalization (materializing `<tbody>`/cells from the converted delta) only runs for
 * user-sourced updates; a silent source leaves the table stuck as an empty placeholder. The
 * unwanted side effect of a user-sourced update — react-quill-new's `onChange` firing for this
 * programmatic change — is suppressed separately via `suppressChangeRef` at the call site.
 */
function applyHtmlContent(editor: InstanceType<typeof Quill>, html: string) {
  const delta = editor.clipboard.convert({ html });
  editor.setContents([{ insert: '\n' }] as never, 'silent');
  editor.updateContents(delta, 'user');
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  style,
  editorHeight = 320,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [sourceDraft, setSourceDraft] = useState('');
  // Bumped to force a fresh <ReactQuill> mount (new `key`) after the source-view
  // toggle — see the mount-correction effect below for why a fresh mount matters.
  const [generation, setGeneration] = useState(0);

  // react-quill-new's own content-loading (componentDidMount, and its
  // shouldComponentUpdate-triggered resync whenever the controlled `value` prop
  // changes) always goes through `editor.setContents(editor.clipboard.convert(...))`
  // — which quill-table-better's own docs say corrupts table rendering;
  // `updateContents` is the documented safe replacement (see applyHtmlContent).
  // Earlier this ran on every `value` change, which reliably broke tables:
  // each repeat correction on an *already live* editor fed table-better's own
  // enriched output back through `clipboard.convert()`, which only expects
  // fresh external HTML, not its own previous output, and would drop the
  // table. Running it exactly once per real mount (true mount or a deliberate
  // `generation`-keyed remount) avoids that — ordinary typing afterwards stays
  // in sync via the normal value/onChange round trip, which react-quill-new's
  // own equality check already no-ops when nothing external changed.
  useLayoutEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const incoming = value || '';
    if (incoming) {
      applyHtmlContent(editor, incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation]);

  const handleChange = (html: string) => {
    onChange?.(html);
  };

  const toggleSource = () => {
    if (showSource) {
      handleChange(sourceDraft);
      setGeneration((g) => g + 1);
      setShowSource(false);
    } else {
      setSourceDraft(value || '');
      setShowSource(true);
    }
  };

  const insertAtCursor = (text: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    editor.insertText(range.index, text, 'user');
    editor.setSelection(range.index + text.length, 0, 'user');
  };

  return (
    <div
      style={style}
      className={isFullscreen ? 'rich-text-editor-fullscreen' : undefined}
    >
      <div className="rich-text-editor-extra-toolbar">
        <Button
          type="text"
          size="small"
          icon={<CodeOutlined />}
          title="نمای HTML"
          onClick={toggleSource}
        >
          {showSource ? 'بازگشت به ویرایشگر' : 'HTML'}
        </Button>
        <Popover
          trigger="click"
          title="کاراکترهای ویژه"
          content={
            <div className="rich-text-editor-picker-grid">
              {SPECIAL_CHARACTERS.map((char) => (
                <button
                  type="button"
                  key={char}
                  onClick={() => insertAtCursor(char)}
                >
                  {char}
                </button>
              ))}
            </div>
          }
        >
          <Button type="text" size="small" disabled={showSource}>
            Ω
          </Button>
        </Popover>
        <Popover
          trigger="click"
          title="شکلک‌ها"
          content={
            <div className="rich-text-editor-picker-grid">
              {EMOJIS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => insertAtCursor(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          }
        >
          <Button
            type="text"
            size="small"
            icon={<SmileOutlined />}
            disabled={showSource}
          />
        </Popover>
        <Button
          type="text"
          size="small"
          icon={
            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          title="تمام‌صفحه"
          onClick={() => setIsFullscreen((prev) => !prev)}
        />
      </div>

      {showSource ? (
        <textarea
          className="rich-text-editor-source-view"
          value={sourceDraft}
          onChange={(e) => setSourceDraft(e.target.value)}
        />
      ) : (
        <ReactQuill
          key={generation}
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          modules={modules}
          style={{ direction: 'rtl', height: editorHeight }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
