"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
        active && "bg-primary-subtle text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("Link URL");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function ArticleEditor({
  initialMarkdown,
  onSave,
  saving,
}: {
  initialMarkdown: string;
  onSave: (markdown: string) => void;
  saving: boolean;
}) {
  const [wordCount, setWordCount] = useState(0);
  const [dirty, setDirty] = useState(false);

  const editor = useEditor({
    extensions: [
      // TipTap v3's StarterKit already bundles Link — configuring it here
      // instead of adding a separate `@tiptap/extension-link` avoids a
      // "duplicate extension" warning (found via the markdown round-trip
      // check; harmless in output, but worth not shipping a warning).
      StarterKit.configure({ link: { openOnClick: false } }),
      Markdown,
    ],
    content: initialMarkdown,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setWordCount(editor.getText().trim().split(/\s+/).filter(Boolean).length);
      setDirty(true);
    },
  });

  useEffect(() => {
    if (editor) {
      setWordCount(editor.getText().trim().split(/\s+/).filter(Boolean).length);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Toolbar editor={editor} />
      <div className="max-h-[70vh] overflow-y-auto p-6">
        <EditorContent
          editor={editor}
          className="max-w-article font-serif text-[17px] leading-[1.75] text-foreground focus:outline-none [&_.ProseMirror]:outline-none"
        />
      </div>
      <div className="flex items-center justify-between border-t border-border p-3">
        <p className="text-caption text-muted-foreground">{wordCount.toLocaleString()} words</p>
        <Button
          disabled={!dirty || saving}
          onClick={() => {
            const markdown = (
              editor.storage as unknown as { markdown: MarkdownStorage }
            ).markdown.getMarkdown();
            onSave(markdown);
            setDirty(false);
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
