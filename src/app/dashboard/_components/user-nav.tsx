'use client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, LogOut, Shield, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

type UserProps = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export function UserNav({ user, isAdmin }: { user: UserProps, isAdmin: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      if (!auth) return;
      await signOut(auth);
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً!",
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "فشل تسجيل الخروج.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
                <LayoutDashboard className="me-2 h-4 w-4" />
                <span>لوحة التحكم</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
                <UserIcon className="me-2 h-4 w-4" />
                <span>الملف الشخصي</span>
            </Link>
          </DropdownMenuItem>
           {isAdmin && (
            <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                    <Shield className="me-2 h-4 w-4 text-primary" />
                    <span>لوحة تحكم المسؤول</span>
                </Link>
            </DropdownMenuItem>
           )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="me-2 h-4 w-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
