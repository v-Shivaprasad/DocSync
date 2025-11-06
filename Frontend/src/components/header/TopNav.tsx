import { useState } from 'react';
import { FileText, Save, Menu } from 'lucide-react';
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
  const { document, updateTitle, saveVersion, isConnected } = useDocument();
  const { user, logout } = useUser();
  const [title, setTitle] = useState(document?.title || 'Untitled Document');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    return date.toLocaleTimeString();
  };

  return (
    <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">

      <div className="flex items-center gap-4 flex-1">

        {/* ✅ Hamburger for mobile */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>

        <FileText className="w-6 h-6 text-primary" />

        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTitle(document?.title || 'Untitled Document');
                setIsEditingTitle(false);
              }
            }}
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

      <div className="flex items-center gap-2">

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveVersion}
          disabled={!isConnected}
          title="Save Version"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Version
        </Button>

        <UserPresence />

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
  );
};

export default TopNav;
