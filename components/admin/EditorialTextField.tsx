"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type QuillType from "quill";
import {
  Code2,
  Expand,
  ImagePlus,
  Languages,
  Link2,
  Loader2,
  Minimize2,
  Redo2,
  Shrink,
  Undo2,
} from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { legacyMarkdownToHtml } from "@/lib/editorial/legacy";
import { safeEditorialUrl, safeVideoEmbedUrl } from "@/lib/editorial/urls";
import {
  ARCHIVE_IMAGE_TYPES,
  describeArchiveFileError,
  uploadToMedia,
} from "@/lib/supabase/upload";
import { cn } from "@/lib/utils";

type EditorialTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  valueEn: string;
  onChangeEn: (value: string) => void;
  rows?: number;
  required?: boolean;
  helper?: string;
  className?: string;
};

type Language = "bn" | "en";

function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function editorHtml(quill: QuillType): string {
  const hasEmbed = Boolean(quill.root.querySelector("img, iframe, video, table"));
  if (!quill.getText().trim() && !hasEmbed) return "";

  // Quill 2 turns its internal list representation into semantic UL/OL here,
  // and table-better supplies semantic HTML for its custom table blots.
  const template = document.createElement("template");
  template.innerHTML = quill.getSemanticHTML();
  template.content
    .querySelectorAll(".ql-table-temporary")
    .forEach((node) => node.remove());
  template.content
    .querySelectorAll(".ql-cell-focused, .ql-cell-selected")
    .forEach((node) => node.classList.remove("ql-cell-focused", "ql-cell-selected"));

  const container = document.createElement("div");
  container.append(template.content.cloneNode(true));
  return container.innerHTML.trim();
}

/**
 * Full bilingual Quill editor. Heavy browser-only modules are loaded after
 * mount, so public routes and the admin server render never evaluate them.
 */
export function EditorialTextField({
  label,
  value,
  onChange,
  valueEn,
  onChangeEn,
  rows = 8,
  required = false,
  helper,
  className,
}: EditorialTextFieldProps) {
  const [lang, setLang] = useState<Language>("bn");
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceDraft, setSourceDraft] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillType | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const handlersRef = useRef({ bn: onChange, en: onChangeEn });
  const valuesRef = useRef({ bn: value, en: valueEn });
  const langRef = useRef<Language>(lang);
  const suppressChangeRef = useRef(false);
  const clientSanitizerRef = useRef<(html: string) => string>((html) => html);
  const id = useId();
  const labelId = `${id}-label`;
  const editorId = `${id}-editor`;
  const current = lang === "bn" ? value : valueEn;

  useEffect(() => {
    handlersRef.current = { bn: onChange, en: onChangeEn };
  }, [onChange, onChangeEn]);

  useEffect(() => {
    valuesRef.current = { bn: value, en: valueEn };
  }, [value, valueEn]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const emit = (next: string) => handlersRef.current[langRef.current](next);

  const loadHtml = (quill: QuillType, source: string) => {
    const html = clientSanitizerRef.current(legacyMarkdownToHtml(source));
    quill.setText("", "silent");
    if (!html) return;
    const delta = quill.clipboard.convert({ html });
    quill.updateContents(delta, "silent");
  };

  const insertImage = (url: string, alt: string, requestedIndex?: number) => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    const index = Math.min(
      Math.max(requestedIndex ?? range.index, 0),
      Math.max(quill.getLength() - 1, 0),
    );
    const accessibleAlt =
      alt.trim() ||
      (langRef.current === "bn" ? "সম্পাদকীয় ছবি" : "Editorial image");

    suppressChangeRef.current = true;
    try {
      quill.insertEmbed(index, "image", url, "user");
      quill.formatText(index, 1, "alt", accessibleAlt, "user");
      quill.setSelection(index + 1, 0, "silent");
    } finally {
      suppressChangeRef.current = false;
    }
    emit(editorHtml(quill));
  };

  const addImageUrl = () => {
    setError(null);
    const raw = window.prompt("HTTPS ছবির লিঙ্ক দিন", "https://");
    if (!raw) return;
    const url = safeEditorialUrl(raw);
    if (!url?.startsWith("https://")) {
      setError("ছবির জন্য একটি সঠিক HTTPS লিঙ্ক দিন।");
      return;
    }
    const alt = window.prompt("ছবির সংক্ষিপ্ত বর্ণনা (ঐচ্ছিক)", "") ?? "";
    insertImage(url, alt);
  };

  const addVideo = () => {
    setError(null);
    const raw = window.prompt("YouTube বা Vimeo-এর HTTPS লিঙ্ক দিন", "https://");
    if (!raw) return;
    const url = safeVideoEmbedUrl(raw);
    if (!url) {
      setError("সঠিক YouTube বা Vimeo HTTPS লিঙ্ক দিন।");
      return;
    }
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, "video", url, "user");
    quill.setSelection(range.index + 1, 0, "silent");
  };

  const changeLink = (add: boolean) => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    if (!add) {
      quill.format("link", false, "user");
      return;
    }

    const raw = window.prompt("HTTPS লিঙ্ক দিন", "https://");
    if (!raw) return;
    const href = safeEditorialUrl(raw);
    if (!href?.startsWith("https://")) {
      setError("শুধু সঠিক HTTPS লিঙ্ক যোগ করা যাবে।");
      return;
    }

    if (range.length > 0) {
      quill.format("link", href, "user");
    } else {
      const text = window.prompt("লিঙ্কের লেখা দিন", href) || href;
      quill.insertText(range.index, text, "link", href, "user");
      quill.setSelection(range.index + text.length, 0, "silent");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function mountEditor() {
      if (!editorRef.current || !toolbarRef.current || quillRef.current) return;

      const [quillModule, tableModule, resizeModule, purifierModule] =
        await Promise.all([
          import("quill"),
          import("quill-table-better"),
          import("quill-resize-module"),
          import("dompurify"),
        ]);
      if (cancelled || !editorRef.current || !toolbarRef.current) return;

      const Quill = quillModule.default;
      const QuillTableBetter = tableModule.default;
      const QuillResize = resizeModule.default;
      const purifier = purifierModule.default;
      clientSanitizerRef.current = (html) => {
        const clean = purifier.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ["iframe"],
          ADD_ATTR: [
            "allow",
            "allowfullscreen",
            "data-cell",
            "data-class",
            "data-row",
            "data-list",
            "frameborder",
          ],
        }) as string;
        const template = document.createElement("template");
        template.innerHTML = clean;

        template.content.querySelectorAll("iframe").forEach((frame) => {
          const src = safeVideoEmbedUrl(frame.getAttribute("src") ?? "");
          if (!src) frame.remove();
          else frame.setAttribute("src", src);
        });
        template.content
          .querySelectorAll<HTMLAnchorElement | HTMLImageElement | HTMLVideoElement | HTMLSourceElement>(
            "a[href], img[src], video[src], source[src]",
          )
          .forEach((element) => {
            const attribute = element instanceof HTMLAnchorElement ? "href" : "src";
            const safe = safeEditorialUrl(element.getAttribute(attribute) ?? "");
            if (!safe) element.removeAttribute(attribute);
            else element.setAttribute(attribute, safe);
          });

        const container = document.createElement("div");
        container.append(template.content.cloneNode(true));
        return container.innerHTML;
      };

      Quill.register({ "modules/table-better": QuillTableBetter }, true);
      Quill.register("modules/resize", QuillResize, true);

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder:
          langRef.current === "bn"
            ? "এখানে বিস্তারিত লিখুন…"
            : "English translation (optional)",
        modules: {
          toolbar: {
            container: toolbarRef.current,
            handlers: {
              image: () => fileRef.current?.click(),
              link: (active: boolean) => changeLink(active),
              video: addVideo,
            },
          },
          table: false,
          "table-better": {
            language: "en_US",
            menus: ["column", "row", "merge", "table", "cell", "wrap", "delete"],
            toolbarTable: true,
          },
          keyboard: { bindings: QuillTableBetter.keyboardBindings },
          history: { delay: 800, maxStack: 150, userOnly: true },
          resize: {
            modules: ["DisplaySize", "Toolbar", "Resize", "Keyboard"],
            keyboardSelect: true,
            embedTags: ["IMG", "IFRAME", "VIDEO"],
            tools: ["left", "center", "right", "full", "edit"],
            parchment: {
              image: { attribute: ["width"], limit: { minWidth: 80 } },
              video: {
                attribute: ["width", "height"],
                limit: { minWidth: 200, ratio: 0.5625 },
              },
            },
            onChangeSize: () => emit(editorHtml(quill)),
            onInactive: () => emit(editorHtml(quill)),
          },
        },
      });

      quill.root.classList.add("editorial-rich-content");
      quill.root.setAttribute("aria-labelledby", labelId);
      quill.root.setAttribute(
        "aria-required",
        required && langRef.current === "bn" ? "true" : "false",
      );
      loadHtml(quill, valuesRef.current[langRef.current]);
      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source !== "silent" && !suppressChangeRef.current) {
          emit(editorHtml(quill));
        }
      });
      quillRef.current = quill;
      setReady(true);
    }

    void mountEditor().catch(() => {
      if (!cancelled) {
        setError("এডিটর লোড করা যায়নি। পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
      }
    });

    return () => {
      cancelled = true;
      quillRef.current = null;
    };
    // The editor is deliberately constructed once; live values/callbacks use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || sourceMode) return;
    const target = clientSanitizerRef.current(legacyMarkdownToHtml(current));
    if (editorHtml(quill) !== target) loadHtml(quill, current);
    quill.root.setAttribute("lang", lang);
    quill.root.setAttribute(
      "aria-required",
      required && lang === "bn" ? "true" : "false",
    );
    // `current` is controlled; loadHtml never emits a user change.
  }, [current, lang, ready, required, sourceMode]);

  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [fullscreen]);

  const addUploadedImage = async (file: File | undefined) => {
    setError(null);
    if (!file || uploading) return;
    if (!ARCHIVE_IMAGE_TYPES.includes(file.type)) {
      setError("শুধু JPG, PNG, WEBP অথবা AVIF ছবি যোগ করা যাবে।");
      return;
    }
    const invalid = describeArchiveFileError(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    const uploadLanguage = langRef.current;
    const uploadIndex = quillRef.current?.getSelection()?.index;
    setUploading(true);
    try {
      const result = await uploadToMedia(file, "archive");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (langRef.current !== uploadLanguage) {
        setError("ভাষা পরিবর্তন হয়েছে। সঠিক ভাষা বেছে ছবিটি আবার যোগ করুন।");
        return;
      }
      insertImage(
        result.url,
        baseName(file.name) ||
          (uploadLanguage === "bn" ? "সংবাদচিত্র" : "News image"),
        uploadIndex,
      );
    } catch {
      setError("ছবি আপলোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selectLanguage = (next: Language) => {
    if (next === lang) return;
    if (sourceMode) {
      setSourceDraft(legacyMarkdownToHtml(next === "bn" ? value : valueEn));
    }
    langRef.current = next;
    setLang(next);
    setError(null);
  };

  const toggleSource = () => {
    const quill = quillRef.current;
    if (!quill) return;
    if (!sourceMode) {
      setSourceDraft(editorHtml(quill));
      setSourceMode(true);
      return;
    }

    const safe = clientSanitizerRef.current(sourceDraft);
    loadHtml(quill, safe);
    const next = editorHtml(quill);
    emit(next);
    setSourceDraft(next);
    setSourceMode(false);
  };

  const clearFormatting = () => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    quill.removeFormat(range.index, range.length || 1, "user");
  };

  const editorStyle = {
    "--editor-min-height": `${Math.max(rows, 5) * 1.7}rem`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "space-y-2",
        fullscreen &&
          "fixed inset-0 z-[100] flex flex-col overflow-auto bg-surface p-4 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={labelId} className="text-sm font-medium text-ink-700">
          {label}
          {required && (
            <span className="ms-1 text-danger" aria-hidden="true">*</span>
          )}
        </span>

        <div
          role="tablist"
          aria-label={`${label} — ভাষা`}
          className="flex items-center gap-0.5 rounded-lg bg-ink-100 p-0.5"
        >
          {(["bn", "en"] as const).map((key) => {
            const content = key === "bn" ? value : valueEn;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={lang === key}
                disabled={uploading}
                onClick={() => selectLanguage(key)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-ui",
                  uploading && "cursor-not-allowed opacity-60",
                  lang === key
                    ? "bg-surface text-ink-900 shadow-xs"
                    : "text-ink-500 hover:text-ink-800",
                )}
              >
                {key === "bn" ? "বাংলা" : "English"}
                {key === "en" && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      content.trim() ? "bg-success" : "bg-ink-300",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "editorial-editor overflow-hidden rounded-xl border border-input bg-surface focus-within:border-brand-600",
          fullscreen && "flex min-h-0 flex-1 flex-col",
        )}
        style={editorStyle}
      >
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label={`${label} সম্পাদনার সরঞ্জাম`}
          className="editorial-toolbar flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-surface-sunken p-1.5"
        >
          <span className="ql-formats">
            <select className="ql-font" defaultValue="" aria-label="ফন্ট">
              <option value="">Sans</option>
              <option value="serif">Serif</option>
              <option value="monospace">Mono</option>
            </select>
            <select className="ql-size" defaultValue="" aria-label="ফন্ট সাইজ">
              <option value="small">Small</option>
              <option value="">Normal</option>
              <option value="large">Large</option>
              <option value="huge">Huge</option>
            </select>
          </span>
          <span className="ql-formats">
            <select className="ql-header" defaultValue="" aria-label="শিরোনামের স্তর">
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
              <option value="4">H4</option>
              <option value="">Paragraph</option>
            </select>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-bold" aria-label="বোল্ড" />
            <button type="button" className="ql-italic" aria-label="ইটালিক" />
            <button type="button" className="ql-underline" aria-label="আন্ডারলাইন" />
            <button type="button" className="ql-strike" aria-label="স্ট্রাইকথ্রু" />
            <button type="button" className="ql-script" value="sub" aria-label="সাবস্ক্রিপ্ট" />
            <button type="button" className="ql-script" value="super" aria-label="সুপারস্ক্রিপ্ট" />
          </span>
          <span className="ql-formats">
            <select className="ql-color" aria-label="লেখার রং" />
            <select className="ql-background" aria-label="হাইলাইট রং" />
          </span>
          <span className="ql-formats">
            <select className="ql-align" defaultValue="" aria-label="অ্যালাইনমেন্ট">
              <option value="" />
              <option value="center" />
              <option value="right" />
              <option value="justify" />
            </select>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-list" value="ordered" aria-label="নম্বর তালিকা" />
            <button type="button" className="ql-list" value="bullet" aria-label="বুলেট তালিকা" />
            <button type="button" className="ql-indent" value="-1" aria-label="ইন্ডেন্ট কমান" />
            <button type="button" className="ql-indent" value="+1" aria-label="ইন্ডেন্ট বাড়ান" />
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-link" aria-label="লিঙ্ক যোগ বা সরান" />
            <button type="button" className="ql-image" aria-label="ছবি আপলোড করুন" />
            <button
              type="button"
              onClick={addImageUrl}
              title="HTTPS URL থেকে ছবি"
              aria-label="HTTPS URL থেকে ছবি"
            >
              <Link2 />
            </button>
            <button type="button" className="ql-video" aria-label="ভিডিও এমবেড করুন" />
            <button type="button" className="ql-table-better" aria-label="টেবিল যোগ বা সম্পাদনা করুন" />
          </span>
          <span className="ql-formats">
            <button type="button" onClick={() => quillRef.current?.history.undo()} title="Undo" aria-label="Undo"><Undo2 /></button>
            <button type="button" onClick={() => quillRef.current?.history.redo()} title="Redo" aria-label="Redo"><Redo2 /></button>
            <button type="button" onClick={clearFormatting} title="ফরম্যাট মুছুন" aria-label="ফরম্যাট মুছুন"><Shrink /></button>
            <button type="button" onClick={toggleSource} aria-pressed={sourceMode} title="HTML source" aria-label="HTML source"><Code2 /></button>
            <button type="button" onClick={() => setFullscreen((active) => !active)} aria-pressed={fullscreen} title={fullscreen ? "Fullscreen বন্ধ করুন (Esc)" : "Fullscreen"} aria-label={fullscreen ? "Fullscreen বন্ধ করুন" : "Fullscreen"}>{fullscreen ? <Minimize2 /> : <Expand />}</button>
          </span>
        </div>

        {!ready && (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-ink-500">
            <Loader2 className="size-4 animate-spin" /> এডিটর লোড হচ্ছে…
          </div>
        )}
        {sourceMode && (
          <Textarea
            id={`${editorId}-source`}
            value={sourceDraft}
            rows={rows}
            spellCheck={false}
            onChange={(event) => {
              const next = event.target.value;
              setSourceDraft(next);
              emit(clientSanitizerRef.current(next));
            }}
            className="editorial-source min-h-(--editor-min-height) flex-1 resize-y rounded-none border-0 font-mono text-sm focus:border-0"
            aria-label={`${label} HTML source`}
          />
        )}
        <div
          id={editorId}
          ref={editorRef}
          aria-hidden={sourceMode || undefined}
          className={cn(
            fullscreen && !sourceMode && "min-h-0 flex-1 overflow-auto",
            (!ready || sourceMode) && "hidden",
          )}
        />

        <input
          ref={fileRef}
          type="file"
          accept={ARCHIVE_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void addUploadedImage(event.target.files?.[0])}
        />
      </div>

      {uploading && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <ImagePlus className="size-3.5" /> ছবি আপলোড হচ্ছে…
        </p>
      )}
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
      {lang === "bn" ? (
        <p className="text-xs leading-5 text-ink-500">
          {helper || "লেখা, ছবি, ভিডিও ও টেবিল format করুন। HTML source-এ পরিবর্তন server-এ নিরাপদ করে সংরক্ষিত হবে।"}
        </p>
      ) : !valueEn.trim() ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Languages className="size-3.5" aria-hidden="true" /> খালি রাখলে ইংরেজি সাইটে বাংলা লেখাটিই দেখাবে।
        </p>
      ) : null}
    </div>
  );
}
