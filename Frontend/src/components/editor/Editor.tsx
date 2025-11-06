import { useRef, useEffect, useCallback } from 'react';
import Page from './Page';
import Toolbar from './Toolbar';
import { useDocument } from '@/contexts/DocumentContext';
import { getCaretOffsetIn } from '../lib/selection';

const Editor = () => {
  const { pages, setPages, updatePages, setCaret, isConnected } = useDocument();
  const containerRef = useRef<HTMLDivElement>(null);
  const isHandlingOverflow = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const addNewPage = useCallback((content = '', afterIndex: number) => {
    setPages(p => {
      const newPages = [...p];
      newPages.splice(afterIndex + 1, 0, content);
      updatePages(newPages);
      return newPages;
    });
  }, [setPages, updatePages]);

  const checkAndHandleOverflow = useCallback((pageElement: HTMLDivElement, pageIndex: number) => {
    if (isHandlingOverflow.current) return;

    const content = pageElement.querySelector('.page-content') as HTMLDivElement;
    if (!content) return;

    const maxHeight = content.clientHeight;

    if (content.scrollHeight > maxHeight) {
      isHandlingOverflow.current = true;
      
      const text = content.innerText;
      let low = 0;
      let high = text.length;
      let bestFit = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testText = text.substring(0, mid);
        content.innerText = testText;
        if (content.scrollHeight <= maxHeight) {
          bestFit = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const fitText = text.substring(0, bestFit);
      const overflowText = text.substring(bestFit);
      
      setPages(currentPages => {
        const newPages = [...currentPages];
        newPages[pageIndex] = fitText;
        
        if (overflowText.trim()) {
          if (pageIndex + 1 < newPages.length) {
            newPages[pageIndex + 1] = overflowText + newPages[pageIndex + 1];
          } else {
            newPages.push(overflowText);
          }
        }
        
        updatePages(newPages);
        return newPages;
      });

      setTimeout(() => {
        isHandlingOverflow.current = false;
        const nextPageElement = pageElement.nextElementSibling as HTMLDivElement;
        if (nextPageElement) {
          checkAndHandleOverflow(nextPageElement, pageIndex + 1);
        }
      }, 50);
    }
  }, [setPages, updatePages]);

  const handleContentChange = (index: number, newContent: string, pageElement?: HTMLDivElement) => {
    const newPages = [...pages];
    newPages[index] = newContent;
    setPages(newPages);

    // ✅ Get caret position
    if (pageElement) {
      const caretOffset = getCaretOffsetIn(pageElement);
      setCaret(index, caretOffset);
    }

    // Debounced real-time sync update
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updatePages(newPages);
    }, 500);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain');
      if (text) document.execCommand('insertText', false, text);
    };

    const container = containerRef.current;
    container?.addEventListener('paste', handlePaste);

    return () => {
      container?.removeEventListener('paste', handlePaste);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <main className="flex-grow flex flex-col bg-gray-50 dark:bg-gray-900/50">
      <Toolbar onAddPage={() => addNewPage('', pages.length - 1)} />

      {!isConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ Reconnecting to server...
        </div>
      )}

      <div id="editor-container" ref={containerRef}>
        {pages.map((content, index) => (
          <Page
            key={index}
            pageNumber={index}
            content={content}
            onContentChange={(newContent, el) => handleContentChange(index, newContent, el)}
            onOverflowCheck={(el) => checkAndHandleOverflow(el, index)}
          />
        ))}
      </div>
    </main>
  );
};

export default Editor;
