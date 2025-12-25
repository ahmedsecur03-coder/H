'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock, LucideIcon } from "lucide-react";

type Status = 'checking' | 'operational' | 'error';

const statusConfig = {
  checking: {
    icon: Clock,
    color: "text-yellow-500",
    text: 'جاري التحقق...',
    pulse: true,
  },
  operational: {
    icon: CheckCircle2,
    color: "text-green-500",
    text: 'يعمل بكفاءة',
    pulse: false,
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    text: 'يوجد خلل',
    pulse: false,
  },
};

interface ServiceCheckItemProps {
    name: string;
    checkFn: () => Promise<boolean>;
    Icon: LucideIcon;
}

export function ServiceCheckItem({ name, checkFn, Icon }: ServiceCheckItemProps) {
    const [status, setStatus] = useState<Status>('checking');

    useEffect(() => {
        let isMounted = true;

        const performCheck = async () => {
            try {
                await checkFn();
                if (isMounted) {
                    setStatus('operational');
                }
            } catch (err) {
                console.error(`Check failed for ${name}:`, err);
                if (isMounted) {
                    setStatus('error');
                }
            }
        };

        // Add a small delay to allow the initial "checking" state to be visible
        const timer = setTimeout(performCheck, 500);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [checkFn, name]);

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">{name}</span>
            </div>
            <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${config.color} ${config.pulse ? 'animate-spin' : ''}`} />
                <span className={`font-semibold text-sm ${config.color}`}>{config.text}</span>
            </div>
        </Card>
    );
}
