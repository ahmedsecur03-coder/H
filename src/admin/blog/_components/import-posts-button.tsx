
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ImportPostsDialog } from './import-posts-dialog';

export function ImportPostsButton({ onImportComplete }: { onImportComplete: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <ImportPostsDialog 
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onImportComplete={onImportComplete}
        >
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Upload className="ml-2 h-4 w-4" />
                استيراد مقالات مقترحة
            </Button>
        </ImportPostsDialog>
    );
}
