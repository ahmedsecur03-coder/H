
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Loader2,
  Users,
  Trophy,
  Rocket,
  Shield,
  Star,
  Sparkles,
  Diamond,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import Link from 'next/link';


export default function HomePage() {
    // This is a public landing page
  return (
    <div className="space-y-12 pb-8">
        <section className="text-center py-20">
            <h1 className="text-5xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-r from-primary via-orange-400 to-primary">
                بوابتك إلى الكون الرقمي
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                منصة حاجاتي هي مركزك المتكامل للخدمات الرقمية. نقدم خدمات SMM، إدارة حملات إعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <Button size="lg" asChild className="text-lg py-7">
                    <Link href="/signup">
                        <Rocket className="ml-2" />
                        انطلق الآن
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg py-7">
                     <Link href="/services">
                        <ShoppingCart className="ml-2" />
                        استكشف الخدمات
                    </Link>
                </Button>
            </div>
        </section>

         <section>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold font-headline">لماذا تختار حاجاتي؟</h2>
                <p className="text-muted-foreground">نحن نقدم أكثر من مجرد خدمات، نحن شريكك في النجاح.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-3 bg-primary/20 rounded-full mb-2">
                           <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>أسعار تنافسية</CardTitle>
                        <CardDescription>أفضل الأسعار في السوق مع الحفاظ على أعلى جودة للخدمات.</CardDescription>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-3 bg-primary/20 rounded-full mb-2">
                           <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>دعم فني فوري</CardTitle>
                        <CardDescription>فريق دعم متخصص جاهز لمساعدتك على مدار الساعة لحل أي مشكلة تواجهك.</CardDescription>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-3 bg-primary/20 rounded-full mb-2">
                           <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>نظام متكامل</CardTitle>
                        <CardDescription>كل ما تحتاجه في مكان واحد، من خدمات SMM إلى إدارة الحملات ونظام الإحالة.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </section>
    </div>
  );
}
