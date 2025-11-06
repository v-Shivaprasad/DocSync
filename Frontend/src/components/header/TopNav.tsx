import { useState } from 'react';
import { FileText, Save, Menu, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserPresence from './UserPresence';
import { useDocument } from '@/contexts/DocumentContext';
import { useUser } from '@/contexts/UserContext';

const TopNav = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const { document, updateTitle, saveVersion, isConnected, isLocked, toggleLock } = useDocument();
  const { user } = useUser();
  const [title, setTitle] = useState(document?.title || 'Untitled Document');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleTitleSave = () => {
    if (title.trim()) {
      updateTitle(title.trim());
      setIsEditingTitle(false);
    }
  };

  const handleSaveVersion = () => {
    const summary = prompt('Enter version summary:', 'Manual save');
    if (summary) saveVersion(summary);
  };

  const formatLastSaved = () => {
    if (!document?.updated_at) return '';
    const date = new Date(document.updated_at);
    return date.toLocaleTimeString();
  };

  return (
    <>
      <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">

        <div className="flex items-center gap-4 flex-1">

          {/* Hamburger (mobile) */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>

          <FileText className="w-6 h-6 text-primary" />

          {/* Title */}
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="max-w-md"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 truncate max-w-md"
              onClick={() => setIsEditingTitle(true)}
            >
              {document?.title || title}
            </h1>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isConnected ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Saved {formatLastSaved()}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                <span>Connecting...</span>
              </>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">

          {/* ✅ ADMIN ONLY: LOCK / UNLOCK BUTTON */}
          {user?.isAdmin && (
            <Button
              variant={isLocked ? "destructive" : "ghost"}
              size="sm"
              onClick={() => toggleLock(!isLocked)}
              disabled={!isConnected}
            >
              {isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {isLocked ? "Unlock Edit" : "Lock Edit"}
            </Button>
          )}

          {/* Save Version */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveVersion}
            disabled={!isConnected}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Version
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShare(true)}
          >
            Share
          </Button>

          <UserPresence />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-gray-500">ID: {user?.id}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem("collab-user");
                  window.location.reload();
                }}
              >
                Switch User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* QR Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-80 text-center space-y-4">
            <h2 className="text-lg font-semibold">Share Document</h2>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
              alt="QR Code"
              className="mx-auto rounded-md border dark:border-gray-600"
            />

            <Button className="w-full" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              Copy Link
            </Button>

            <Button variant="secondary" className="w-full" onClick={() => setShowShare(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
