'use client';

import * as React from 'react';
import {
  Bell,
  Check,
  Circle,
  Gift,
  Info,
  Rocket,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import type { Notification, User } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const notificationIcons: { [key in Notification['type']]: React.ElementType } = {
  info: Info,
  success: Gift,
  warning: TriangleAlert,
  error: ShieldAlert,
};

function TimeAgo({ dateString }: { dateString: string }) {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch (error) {
    return dateString;
  }
}

export function Notifications({ userData }: { userData: User }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);

  const sortedNotifications = React.useMemo(() => {
    return [...(userData.notifications || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [userData.notifications]);

  const unreadCount = React.useMemo(() => {
    return sortedNotifications.filter((n) => !n.read).length;
  }, [sortedNotifications]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0 && user && firestore) {
      // Mark all as read
      const userRef = doc(firestore, 'users', user.uid);
      const updatedNotifications = sortedNotifications.map((n) => ({
        ...n,
        read: true,
      }));
      await updateDoc(userRef, { notifications: updatedNotifications });
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortedNotifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            {sortedNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Info;
              const item = (
                <div
                  className={cn(
                    'flex items-start gap-3 p-2 transition-colors',
                    !notification.read && 'bg-accent'
                  )}
                >
                  {!notification.read && (
                    <Circle className="h-2 w-2 flex-shrink-0 fill-primary text-primary mt-1.5" />
                  )}
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 mt-1',
                      notification.read && 'ms-4',
                       notification.type === 'success' && 'text-green-500',
                       notification.type === 'error' && 'text-destructive',
                       notification.type === 'warning' && 'text-yellow-500',
                    )}
                  />
                  <div className="flex-grow">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      <TimeAgo dateString={notification.createdAt} />
                    </p>
                  </div>
                </div>
              );

              return (
                <DropdownMenuItem key={notification.id} asChild className="p-0 cursor-pointer">
                  {notification.href ? (
                    <Link href={notification.href}>{item}</Link>
                  ) : (
                    <div>{item}</div>
                  )}
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            لا توجد إشعارات جديدة.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
