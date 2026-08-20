import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

/**
 * Rich text editor component props
 * Integrates with React Hook Form
 */
interface RichTextEditorProps {
  // Content value (HTML string)
  value?: string;
  // Callback when content changes
  onChange: (content: string) => void;
  // Placeholder text
  placeholder?: string;
  // Error state
  error?: boolean;
  // Disabled state
  disabled?: boolean;
  // Minimum height
  minHeight?: string;
}

/**
 * Rich text editor component
 * Uses Tiptap with StarterKit for formatting
 * Supports: Bold, Italic, Bullet List, Numbered List
 */
export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Enter event description...",
  error = false,
  disabled = false,
  minHeight = "200px",
}: RichTextEditorProps) {
  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading and other unnecessary features
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        // Enable bullet list and ordered list
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      // Add placeholder extension
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Get HTML content from editor
      const html = editor.getHTML();
      // Call onChange callback with HTML content
      onChange(html);
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Get current editor HTML content
    const currentContent = editor.getHTML();
    // Only update if content is different (prevents infinite loops)
    if (currentContent !== value) {
      // Set editor content from value prop
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);


  // Handle bold formatting toggle
  const toggleBold = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle bold formatting
    editor.chain().focus().toggleBold().run();
  };

  // Handle italic formatting toggle
  const toggleItalic = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle italic formatting
    editor.chain().focus().toggleItalic().run();
  };


  // Check if editor is initialized
  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border bg-background border-border transition-all",
        error && "border-red-500"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border">
        {/* Bold button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-accent"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        {/* Italic button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleItalic}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-accent"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>
      {/* Editor content */}
      <div
        className="p-4"
        style={{ minHeight }}
      >
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none font-poppins [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:ring-0 [&_.ProseMirror]:border-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>
    </div>
  );
}

