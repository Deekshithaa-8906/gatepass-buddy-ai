import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-primary-foreground hover:bg-[hsl(0,100%,40%)] transition-colors p-0 overflow-hidden"
        >
          {user.profilePhoto ? (
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.profilePhoto} />
              <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
            </Avatar>
          ) : (
            <User className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-white text-black rounded-xl shadow-lg border border-border p-0"
      >
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.profilePhoto} />
              <AvatarFallback className="bg-muted text-muted-foreground">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DropdownMenuLabel className="text-base font-bold text-black p-0">
                {user.name}
              </DropdownMenuLabel>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-black">
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Phone:</span> {user.phone}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 hover:!bg-red-50 font-semibold gap-2 px-4 py-2"
          onClick={() => { logout(); navigate('/'); }}
        >
          <LogOut className="w-4 h-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
