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
          className="rounded-full text-primary-foreground hover:bg-[hsl(0,100%,40%)] transition-colors"
        >
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-white text-black rounded-xl shadow-lg border border-border p-0"
      >
        <div className="p-4 space-y-2">
          <DropdownMenuLabel className="text-base font-bold text-black p-0">
            {user.name}
          </DropdownMenuLabel>
          <div className="space-y-1 text-sm text-black">
            <p><span className="font-semibold">Role:</span> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
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
