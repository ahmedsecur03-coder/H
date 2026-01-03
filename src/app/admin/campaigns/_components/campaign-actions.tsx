'use client';

import React, { useState } from 'react';
import { handleAdminAction } from '@/app/admin/_actions/admin-actions';
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export function CampaignActions({ campaign, onUpdate }: { campaign: Campaign; onUpdate: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'activate' | 'pause' | 'delete') => {
        setLoading(true);

        try {
            const result = await handleAdminAction({
                action: 'handle-campaign',
                payload: {
                    userId: campaign.userId,
                    campaignId: campaign.id,
                    subAction: action
                }
            });

             if (result.success) {
                toast({ title: 'نجاح', description: `تم ${action === 'delete' ? 'حذف' : action === 'activate' ? 'تفعيل' : 'إيقاف'} الحملة بنجاح.` });
                onUpdate();
            } else {
                throw new Error(result.error || 'فشل الإجراء من الخادم.');
            }
        } catch (error: any) {
            console.error("Campaign Action Error:", error);
            toast({ variant: 'destructive', title: 'فشل الإجراء', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />;
    }

    return (
        <div className="flex gap-1">
            {campaign.status === 'متوقف' && (
                 <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleAction('activate')}>
                    <Play className="h-4 w-4" />
                </Button>
            )}
             {campaign.status === 'نشط' && (
                 <Button variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-600" onClick={() => handleAction('pause')}>
                    <Pause className="h-4 w-4" />
                </Button>
            )}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء سيحذف الحملة بشكل نهائي. لا يمكن التراجع عن هذا الأمر.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAction('delete')}>متابعة الحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
