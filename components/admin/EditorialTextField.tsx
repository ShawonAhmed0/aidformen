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
import { useAdminLocale } from "./AdminLocale";
import { TranslateButton } from "./TranslateButton";

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

const copy = {
  bn: {
    imageUrlPrompt: "HTTPS ছবির লিঙ্ক দিন",
    imageUrlInvalid: "ছবির জন্য একটি সঠিক HTTPS লিঙ্ক দিন।",
    imageAltPrompt: "ছবির সংক্ষিপ্ত বর্ণনা (ঐচ্ছিক)",
    videoPrompt: "YouTube বা Vimeo-এর HTTPS লিঙ্ক দিন",
    videoInvalid: "সঠিক YouTube বা Vimeo HTTPS লিঙ্ক দিন।",
    linkPrompt: "HTTPS লিঙ্ক দিন",
    linkInvalid: "শুধু সঠিক HTTPS লিঙ্ক যোগ করা যাবে।",
    linkTextPrompt: "লিঙ্কের লেখা দিন",
    placeholder: "এখানে বিস্তারিত লিখুন…",
    placeholderEn: "ইংরেজি অনুবাদ (ঐচ্ছিক)",
    loadFailed: "এডিটর লোড করা যায়নি। পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।",
    imageWrongType: "শুধু JPG, PNG, WEBP অথবা AVIF ছবি যোগ করা যাবে।",
    languageChanged: "ভাষা পরিবর্তন হয়েছে। সঠিক ভাষা বেছে ছবিটি আবার যোগ করুন।",
    uploadFailed: "ছবি আপলোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
    languageTabs: (label: string) => `${label} — ভাষা`,
    toolbar: (label: string) => `${label} সম্পাদনার সরঞ্জাম`,
    font: "ফন্ট",
    fontSize: "ফন্ট সাইজ",
    sizeSmall: "ছোট",
    sizeNormal: "সাধারণ",
    sizeLarge: "বড়",
    sizeHuge: "খুব বড়",
    headingLevel: "শিরোনামের স্তর",
    paragraph: "অনুচ্ছেদ",
    bold: "বোল্ড",
    italic: "ইটালিক",
    underline: "আন্ডারলাইন",
    strike: "স্ট্রাইকথ্রু",
    subscript: "সাবস্ক্রিপ্ট",
    superscript: "সুপারস্ক্রিপ্ট",
    textColor: "লেখার রং",
    highlightColor: "হাইলাইট রং",
    align: "অ্যালাইনমেন্ট",
    orderedList: "নম্বর তালিকা",
    bulletList: "বুলেট তালিকা",
    outdent: "ইন্ডেন্ট কমান",
    indent: "ইন্ডেন্ট বাড়ান",
    link: "লিঙ্ক যোগ বা সরান",
    uploadImage: "ছবি আপলোড করুন",
    imageFromUrl: "HTTPS URL থেকে ছবি",
    embedVideo: "ভিডিও এমবেড করুন",
    table: "টেবিল যোগ বা সম্পাদনা করুন",
    undo: "আগের অবস্থায় ফিরুন",
    redo: "আবার করুন",
    clearFormatting: "ফরম্যাট মুছুন",
    htmlSource: "HTML সোর্স",
    fullscreen: "ফুলস্ক্রিন",
    exitFullscreen: "Fullscreen বন্ধ করুন",
    exitFullscreenHint: "Fullscreen বন্ধ করুন (Esc)",
    loading: "এডিটর লোড হচ্ছে…",
    sourceField: (label: string) => `${label} HTML সোর্স`,
    uploadingImage: "ছবি আপলোড হচ্ছে…",
    helper:
      "লেখা, ছবি, ভিডিও ও টেবিল format করুন। HTML source-এ পরিবর্তন server-এ নিরাপদ করে সংরক্ষিত হবে।",
    fallbackNote: "খালি রাখলে ইংরেজি সাইটে বাংলা লেখাটিই দেখাবে।",
  },
  en: {
    imageUrlPrompt: "Enter an HTTPS image link",
    imageUrlInvalid: "Enter a valid HTTPS link for the image.",
    imageAltPrompt: "Short description of the image (optional)",
    videoPrompt: "Enter a YouTube or Vimeo HTTPS link",
    videoInvalid: "Enter a valid YouTube or Vimeo HTTPS link.",
    linkPrompt: "Enter an HTTPS link",
    linkInvalid: "Only valid HTTPS links can be added.",
    linkTextPrompt: "Enter the link text",
    placeholder: "Write the details here…",
    placeholderEn: "English translation (optional)",
    loadFailed: "The editor could not load. Refresh the page and try again.",
    imageWrongType: "Only JPG, PNG, WEBP or AVIF images can be added.",
    languageChanged:
      "The language was switched. Choose the right language and add the image again.",
    uploadFailed: "The image could not be uploaded. Check your connection and try again.",
    languageTabs: (label: string) => `${label} — language`,
    toolbar: (label: string) => `${label} editing tools`,
    font: "Font",
    fontSize: "Font size",
    sizeSmall: "Small",
    sizeNormal: "Normal",
    sizeLarge: "Large",
    sizeHuge: "Huge",
    headingLevel: "Heading level",
    paragraph: "Paragraph",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strike: "Strikethrough",
    subscript: "Subscript",
    superscript: "Superscript",
    textColor: "Text colour",
    highlightColor: "Highlight colour",
    align: "Alignment",
    orderedList: "Numbered list",
    bulletList: "Bulleted list",
    outdent: "Decrease indent",
    indent: "Increase indent",
    link: "Add or remove link",
    uploadImage: "Upload image",
    imageFromUrl: "Image from an HTTPS URL",
    embedVideo: "Embed video",
    table: "Add or edit table",
    undo: "Undo",
    redo: "Redo",
    clearFormatting: "Clear formatting",
    htmlSource: "HTML source",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    exitFullscreenHint: "Exit fullscreen (Esc)",
    loading: "Loading editor…",
    sourceField: (label: string) => `${label} HTML source`,
    uploadingImage: "Uploading image…",
    helper:
      "Format text, images, video and tables. Changes made in HTML source are sanitised on the server before saving.",
    fallbackNote: "If left empty, the English site shows the Bengali text.",
  },
};

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
  const t = copy[useAdminLocale()];
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
  // Quill keeps the toolbar handlers and the load-failure path from the first
  // render, so the text they show is read from here when they run.
  const copyRef = useRef(t);
  // Which of the two placeholders Quill was built with.
  const placeholderRef = useRef<"placeholder" | "placeholderEn">("placeholder");
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

  useEffect(() => {
    copyRef.current = t;
  }, [t]);

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
    const raw = window.prompt(t.imageUrlPrompt, "https://");
    if (!raw) return;
    const url = safeEditorialUrl(raw);
    if (!url?.startsWith("https://")) {
      setError(t.imageUrlInvalid);
      return;
    }
    const alt = window.prompt(t.imageAltPrompt, "") ?? "";
    insertImage(url, alt);
  };

  const addVideo = () => {
    setError(null);
    const raw = window.prompt(copyRef.current.videoPrompt, "https://");
    if (!raw) return;
    const url = safeVideoEmbedUrl(raw);
    if (!url) {
      setError(copyRef.current.videoInvalid);
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

    const raw = window.prompt(copyRef.current.linkPrompt, "https://");
    if (!raw) return;
    const href = safeEditorialUrl(raw);
    if (!href?.startsWith("https://")) {
      setError(copyRef.current.linkInvalid);
      return;
    }

    if (range.length > 0) {
      quill.format("link", href, "user");
    } else {
      const text = window.prompt(copyRef.current.linkTextPrompt, href) || href;
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

      placeholderRef.current =
        langRef.current === "bn" ? "placeholder" : "placeholderEn";
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: copyRef.current[placeholderRef.current],
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
        setError(copyRef.current.loadFailed);
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

  // Quill takes its placeholder and builds its toolbar pickers from the
  // <select>s once, at construction. An interface-language switch re-renders
  // the markup below but not those copies, so carry the new text across.
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.root.dataset.placeholder = t[placeholderRef.current];

    toolbarRef.current?.querySelectorAll("select").forEach((select) => {
      const picker = select.previousElementSibling;
      if (!picker?.classList.contains("ql-picker")) return;
      const name = select.getAttribute("aria-label");
      if (name) picker.setAttribute("aria-label", name);

      const labels = new Map(
        Array.from(select.options, (option) => [
          option.value,
          option.textContent ?? "",
        ]),
      );
      picker
        .querySelectorAll(".ql-picker-label[data-label], .ql-picker-item[data-label]")
        .forEach((node) => {
          const text = labels.get(node.getAttribute("data-value") ?? "");
          if (text) node.setAttribute("data-label", text);
        });
    });
  }, [ready, t]);

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
      setError(t.imageWrongType);
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
        setError(t.languageChanged);
        return;
      }
      insertImage(
        result.url,
        baseName(file.name) ||
          (uploadLanguage === "bn" ? "সংবাদচিত্র" : "News image"),
        uploadIndex,
      );
    } catch {
      setError(t.uploadFailed);
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

        <div className="flex flex-wrap items-center gap-1.5">
        <TranslateButton
          source={value}
          target={valueEn}
          onTranslated={(english) => {
            onChangeEn(english);
            // Not selectLanguage(): it would reload the source draft from the
            // English value as it was before this update landed.
            if (sourceMode) setSourceDraft(english);
            langRef.current = "en";
            setLang("en");
            setError(null);
          }}
        />
        <div
          role="tablist"
          aria-label={t.languageTabs(label)}
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
          aria-label={t.toolbar(label)}
          className="editorial-toolbar flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-surface-sunken p-1.5"
        >
          <span className="ql-formats">
            <select className="ql-font" defaultValue="" aria-label={t.font}>
              <option value="">Sans</option>
              <option value="serif">Serif</option>
              <option value="monospace">Mono</option>
            </select>
            <select className="ql-size" defaultValue="" aria-label={t.fontSize}>
              <option value="small">{t.sizeSmall}</option>
              <option value="">{t.sizeNormal}</option>
              <option value="large">{t.sizeLarge}</option>
              <option value="huge">{t.sizeHuge}</option>
            </select>
          </span>
          <span className="ql-formats">
            <select className="ql-header" defaultValue="" aria-label={t.headingLevel}>
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
              <option value="4">H4</option>
              <option value="">{t.paragraph}</option>
            </select>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-bold" aria-label={t.bold} />
            <button type="button" className="ql-italic" aria-label={t.italic} />
            <button type="button" className="ql-underline" aria-label={t.underline} />
            <button type="button" className="ql-strike" aria-label={t.strike} />
            <button type="button" className="ql-script" value="sub" aria-label={t.subscript} />
            <button type="button" className="ql-script" value="super" aria-label={t.superscript} />
          </span>
          <span className="ql-formats">
            <select className="ql-color" aria-label={t.textColor} />
            <select className="ql-background" aria-label={t.highlightColor} />
          </span>
          <span className="ql-formats">
            <select className="ql-align" defaultValue="" aria-label={t.align}>
              <option value="" />
              <option value="center" />
              <option value="right" />
              <option value="justify" />
            </select>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-list" value="ordered" aria-label={t.orderedList} />
            <button type="button" className="ql-list" value="bullet" aria-label={t.bulletList} />
            <button type="button" className="ql-indent" value="-1" aria-label={t.outdent} />
            <button type="button" className="ql-indent" value="+1" aria-label={t.indent} />
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-link" aria-label={t.link} />
            <button type="button" className="ql-image" aria-label={t.uploadImage} />
            <button
              type="button"
              onClick={addImageUrl}
              title={t.imageFromUrl}
              aria-label={t.imageFromUrl}
            >
              <Link2 />
            </button>
            <button type="button" className="ql-video" aria-label={t.embedVideo} />
            <button type="button" className="ql-table-better" aria-label={t.table} />
          </span>
          <span className="ql-formats">
            <button type="button" onClick={() => quillRef.current?.history.undo()} title={t.undo} aria-label={t.undo}><Undo2 /></button>
            <button type="button" onClick={() => quillRef.current?.history.redo()} title={t.redo} aria-label={t.redo}><Redo2 /></button>
            <button type="button" onClick={clearFormatting} title={t.clearFormatting} aria-label={t.clearFormatting}><Shrink /></button>
            <button type="button" onClick={toggleSource} aria-pressed={sourceMode} title={t.htmlSource} aria-label={t.htmlSource}><Code2 /></button>
            <button type="button" onClick={() => setFullscreen((active) => !active)} aria-pressed={fullscreen} title={fullscreen ? t.exitFullscreenHint : t.fullscreen} aria-label={fullscreen ? t.exitFullscreen : t.fullscreen}>{fullscreen ? <Minimize2 /> : <Expand />}</button>
          </span>
        </div>

        {!ready && (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-ink-500">
            <Loader2 className="size-4 animate-spin" /> {t.loading}
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
            aria-label={t.sourceField(label)}
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
          <ImagePlus className="size-3.5" /> {t.uploadingImage}
        </p>
      )}
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
      {lang === "bn" ? (
        <p className="text-xs leading-5 text-ink-500">
          {helper || t.helper}
        </p>
      ) : !valueEn.trim() ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Languages className="size-3.5" aria-hidden="true" /> {t.fallbackNote}
        </p>
      ) : null}
    </div>
  );
}
