import { useRef, useEffect } from 'react';
import { getCaretOffsetIn } from '../lib/selection';

interface PageProps {
  pageNumber: number;
  content: string;
  onContentChange: (content: string, element: HTMLDivElement) => void;
  onOverflowCheck: (element: HTMLDivElement) => void;
}

const Page = ({ pageNumber, content, onContentChange, onOverflowCheck }: PageProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // ✅ Sync restored version or remote update to UI
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== content) {
      contentRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    const el = contentRef.current;
    if (!el) return;

    const html = el.innerHTML;              // ✅ keep formatting
    const caretOffset = getCaretOffsetIn(el);

    onContentChange(html, el);              // ✅ send formatted content up

    if (pageRef.current) {
      setTimeout(() => onOverflowCheck(pageRef.current!), 15);
    }
  };

  return (
    <div className="page" data-page-index={pageNumber} ref={pageRef}>
      <div
        ref={contentRef}
        className="page-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={handleInput}
        onClick={handleInput}
      />
      <div className="page-number">{pageNumber + 1}</div>
    </div>
  );
};

export default Page;
