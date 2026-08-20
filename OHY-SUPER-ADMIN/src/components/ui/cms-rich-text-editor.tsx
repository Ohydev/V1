// Import React hook for effect handling.
import { useEffect } from "react";
// Import Tiptap editor hooks and components.
import { useEditor, EditorContent } from "@tiptap/react";
// Import Tiptap StarterKit for basic formatting features.
import StarterKit from "@tiptap/starter-kit";
// Import Tiptap Placeholder extension for placeholder text.
import Placeholder from "@tiptap/extension-placeholder";
// Import Tiptap Link extension for hyperlink support.
import Link from "@tiptap/extension-link";
// Import Underline extension for underline formatting.
import Underline from "@tiptap/extension-underline";
// Import lucide-react icons for toolbar buttons.
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Eraser,
} from "lucide-react";
// Import UI components.
import { Button } from "@/components/ui/button";
// Import utility function for merging class names.
import { cn } from "@/lib/utils";

/**
 * CMS Rich Text Editor component props
 * Enhanced version with headings, links, and full formatting support
 * Integrates with React Hook Form
 */
interface CmsRichTextEditorProps {
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
 * CMS Rich Text Editor component
 * Uses Tiptap with enhanced features for CMS content editing
 * Supports: Headings (H1, H2, H3), Bold, Italic, Underline, Bullet List, Numbered List, Links
 */
export function CmsRichTextEditor({
  value = "",
  onChange,
  placeholder = "Enter CMS page content...",
  error = false,
  disabled = false,
  minHeight = "400px",
}: CmsRichTextEditorProps) {
  // Initialize Tiptap editor with enhanced extensions
  const editor = useEditor({
    extensions: [
      // Configure StarterKit with headings enabled for CMS content
      StarterKit.configure({
        // Enable heading support (H1, H2, H3)
        heading: {
          levels: [1, 2, 3],
        },
        // Enable bullet list support
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Enable ordered list support
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Disable unnecessary features for CMS
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      // Add Link extension with URL validation
      Link.configure({
        // Open links in new tab by default
        openOnClick: false,
        // Add HTML attributes to links
        HTMLAttributes: {
          class: "text-primary underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      // Add Underline extension for underline formatting
      Underline,
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

  // Handle underline formatting toggle
  const toggleUnderline = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle underline formatting
    editor.chain().focus().toggleUnderline().run();
  };

  // Handle heading level 1 toggle
  const toggleHeading1 = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle heading level 1
    editor.chain().focus().toggleHeading({ level: 1 }).run();
  };

  // Handle heading level 2 toggle
  const toggleHeading2 = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle heading level 2
    editor.chain().focus().toggleHeading({ level: 2 }).run();
  };

  // Handle heading level 3 toggle
  const toggleHeading3 = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle heading level 3
    editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  // Handle bullet list toggle
  const toggleBulletList = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle bullet list
    editor.chain().focus().toggleBulletList().run();
  };

  // Handle ordered list toggle
  const toggleOrderedList = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Toggle ordered list
    editor.chain().focus().toggleOrderedList().run();
  };

  // Handle link insertion
  const setLink = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Get current selection URL if link is already active
    const previousUrl = editor.getAttributes("link").href;
    // Prompt user for URL
    const url = window.prompt("Enter URL:", previousUrl || "https://");
    // Cancel if user cancelled
    if (url === null) {
      return;
    }
    // Remove link if URL is empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    // Set link with URL
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Handle clear formatting
  const clearFormatting = () => {
    // Check if editor is initialized
    if (!editor) {
      return;
    }
    // Clear all formatting
    editor.chain().focus().clearNodes().unsetAllMarks().run();
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
      {/* Toolbar with all formatting options */}
      <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
        {/* Heading 1 button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleHeading1}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 1 }) && "bg-accent"
          )}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        {/* Heading 2 button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleHeading2}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 2 }) && "bg-accent"
          )}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        {/* Heading 3 button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleHeading3}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 3 }) && "bg-accent"
          )}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        {/* Separator */}
        <div className="w-px h-6 bg-border mx-1" />
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
          title="Bold"
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
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        {/* Underline button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleUnderline}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("underline") && "bg-accent"
          )}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        {/* Separator */}
        <div className="w-px h-6 bg-border mx-1" />
        {/* Bullet list button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBulletList}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-accent"
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        {/* Ordered list button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleOrderedList}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("orderedList") && "bg-accent"
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        {/* Separator */}
        <div className="w-px h-6 bg-border mx-1" />
        {/* Link button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("link") && "bg-accent"
          )}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        {/* Separator */}
        <div className="w-px h-6 bg-border mx-1" />
        {/* Clear formatting button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFormatting}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Clear Formatting"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>
      {/* Editor content area */}
      <div className="p-4" style={{ minHeight }}>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none font-poppins [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:ring-0 [&_.ProseMirror]:border-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>
    </div>
  );
}

