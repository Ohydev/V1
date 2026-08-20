/**
 * HTML Utility Functions
 * Utility functions for converting HTML content to plain text
 */

/**
 * Detect if text contains HTML tags
 * Uses regex pattern to match HTML tags like <p>, </p>, <strong>, etc.
 * @param text - Text to check for HTML tags
 * @returns True if text contains HTML tags, false otherwise
 */
export const isRichText = (text: string | null | undefined): boolean => {
  // Return false if text is null, undefined, or empty
  if (!text || text.trim() === '') {
    return false;
  }
  // Check if text contains HTML tags using regex pattern
  // Pattern matches opening/closing tags like <p>, </p>, <strong>, etc.
  // Escape < and > characters and use character class for tag name
  const htmlTagPattern = /<\/?[a-z][^>]*>/i;
  // Return true if HTML tags are found
  return htmlTagPattern.test(text);
};

/**
 * Convert HTML content to formatted plain text
 * Preserves paragraph spacing and converts list items to bullet points
 * Only converts if HTML tags are present, otherwise returns text as-is
 * @param html - HTML string that may contain tags
 * @returns Formatted plain text with proper spacing and bullet points
 */
export const htmlToPlainText = (html: string | null | undefined): string => {
  // Return empty string if html is null or undefined
  if (!html) {
    return '';
  }

  // First, clean up any markdown-style formatting that might be mixed in (like ** around HTML)
  // Remove markdown bold markers (**) that might wrap HTML tags
  let cleanedHtml = html.replace(/\*\*<([^>]+)>\*\*/g, '<$1>');
  // Remove markdown bold markers (**) that might be inside or around content
  cleanedHtml = cleanedHtml.replace(/\*\*/g, '');

  // Check if content contains HTML tags after cleaning
  if (!isRichText(cleanedHtml)) {
    // Return text as-is if no HTML tags found
    return cleanedHtml.trim();
  }

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  
  try {
    // Set innerHTML to parse the HTML string
    tempDiv.innerHTML = cleanedHtml;
  } catch (error) {
    // If parsing fails, fall back to regex-based extraction
    // This handles malformed HTML or edge cases
    return cleanedHtml
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Function to recursively process DOM nodes
  const processNode = (node: Node): string => {
    // Initialize result string
    let result = '';

    // Process child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      // Check node type
      if (child.nodeType === Node.TEXT_NODE) {
        // Append text content directly, preserving spaces
        const text = child.textContent || '';
        result += text;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        // Handle different HTML elements
        if (tagName === 'p') {
          // Paragraph: add double line break before and after
          const content = processNode(element);
          if (content.trim()) {
            // Add double newline before if result already has content
            if (result && !result.endsWith('\n\n')) {
              result += '\n\n';
            }
            result += content.trim();
            // Add double newline after
            result += '\n\n';
          }
        } else if (tagName === 'br') {
          // Line break: add newline
          result += '\n';
        } else if (tagName === 'ul' || tagName === 'ol') {
          // List: process list items with spacing
          const listContent = processNode(element);
          if (listContent.trim()) {
            // Add double newline before list if result already has content
            if (result && !result.endsWith('\n\n')) {
              result += '\n\n';
            }
            result += listContent.trim();
            // Add double newline after list
            result += '\n\n';
          }
        } else if (tagName === 'li') {
          // List item: add bullet point and newline
          const content = processNode(element);
          if (content.trim()) {
            // Add newline before if not first item and result doesn't already end with newline
            if (result && !result.endsWith('\n') && !result.endsWith('• ')) {
              result += '\n';
            }
            // Add bullet point and content
            result += '• ' + content.trim();
          }
        } else if (tagName === 'strong' || tagName === 'b') {
          // Bold: process content (no special formatting, just text)
          result += processNode(element);
        } else if (tagName === 'em' || tagName === 'i') {
          // Italic: process content (no special formatting, just text)
          result += processNode(element);
        } else if (tagName === 'div') {
          // Div: add line break if content exists
          const content = processNode(element);
          if (content.trim()) {
            result += (result ? '\n' : '') + content.trim();
          }
        } else {
          // Other elements: process children recursively
          result += processNode(element);
        }
      }
    }

    // Return processed result
    return result;
  };

  // Process the parsed HTML
  const plainText = processNode(tempDiv);
  
  // Clean up: remove extra whitespace and normalize line breaks
  let cleanedText = plainText
    // Replace multiple consecutive newlines (3+) with double newline (paragraph spacing)
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple spaces with single space (but preserve intentional spacing)
    .replace(/[ \t]+/g, ' ')
    // Trim leading and trailing whitespace
    .trim();

  // Decode common HTML entities that might remain
  cleanedText = cleanedText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Final cleanup: remove any remaining extra spaces
  cleanedText = cleanedText
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Return cleaned plain text
  return cleanedText;
};

