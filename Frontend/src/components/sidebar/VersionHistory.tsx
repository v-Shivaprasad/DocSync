import { GitCommit, GitBranch } from 'lucide-react';
import { useDocument } from '@/contexts/DocumentContext';

const VersionHistory = () => {
  const { versions, restoreVersion } = useDocument(); // ✅ Add restoreVersion here

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <aside className="w-72 border-l bg-white dark:bg-gray-800 dark:border-gray-700 p-4 flex flex-col shrink-0">
      <h2 className="text-lg font-semibold mb-4">Version History</h2>
      
      {versions.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-500 text-sm text-center">
          <div>
            <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No version history yet</p>
            <p className="text-xs mt-1">Click "Save Version" to create snapshots</p>
          </div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          <ul className="space-y-4">
            {versions.map((version, index) => (
              <li 
                key={version.id} 
                className="flex gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition"
                onClick={() => restoreVersion(version)}  // ✅ CLICK TO RESTORE
              >
                <div className="flex flex-col items-center">
                  <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    {index % 3 === 0 ? (
                      <GitBranch className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <GitCommit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  {index < versions.length - 1 && (
                    <div className="w-px flex-grow bg-gray-300 dark:bg-gray-600 mt-2" />
                  )}
                </div>

                <div className="flex-grow pb-4">
                  <p className="font-medium text-sm">{version.summary}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {version.editor} · {formatTimestamp(version.timestamp)}
                  </p>
                  {version.pages && (
                    <p className="text-xs text-gray-400 mt-1">
                      {version.pages.length} page{version.pages.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default VersionHistory;
