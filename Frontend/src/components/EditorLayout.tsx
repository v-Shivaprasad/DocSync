import { useState } from 'react';
import TopNav from './header/TopNav';
import Editor from './editor/Editor';
import VersionHistory from './sidebar/VersionHistory';

const EditorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <TopNav onToggleSidebar={() => setSidebarOpen((p) => !p)} />

      <div className="flex flex-grow overflow-hidden">
        <Editor />

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <VersionHistory />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="w-72 bg-white dark:bg-gray-800 shadow-lg h-full">
              <VersionHistory />
            </div>
            <div
              className="flex-1 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorLayout;
