import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useDocument } from '@/contexts/DocumentContext';
import { useUser } from '@/contexts/UserContext';

const UserPresence = () => {
  const { connectedUsers } = useDocument();
  const { user } = useUser();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Typing':
        return 'bg-green-500';
      case 'Viewing':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  const totalUsers = connectedUsers.length + 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{totalUsers}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Connected Users ({totalUsers})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-primary">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
            </div>
            <div>
              <div className="text-sm font-medium">{user?.name} (You)</div>
              <div className="text-xs text-gray-500">Editing</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {connectedUsers.length > 0 && <DropdownMenuSeparator />}

        {connectedUsers.length === 0 ? (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            No other users online
          </div>
        ) : (
          <DropdownMenuGroup>
            {connectedUsers.map((connectedUser) => (
              <DropdownMenuItem key={connectedUser.user_id} className="flex items-center gap-2">
                <div className="relative">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: connectedUser.color }}
                  >
                    {connectedUser.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span 
                    className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${getStatusColor(connectedUser.status)} ring-2 ring-white dark:ring-gray-800`} 
                  />
                </div>
                <div>
                  <div className="text-sm font-medium">{connectedUser.user_name}</div>
                  <div className="text-xs text-gray-500">{connectedUser.status}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserPresence;