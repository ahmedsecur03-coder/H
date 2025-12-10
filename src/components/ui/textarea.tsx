import * as React from 'react';

import {cn} from '@/lib/utils';
import { useImperativeHandle, useRef } from 'react';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    React.useEffect(() => {
        const textarea = localRef.current;
        if (textarea) {
            const handleInput = () => {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            };
            textarea.addEventListener('input', handleInput);
            // Initial resize
            handleInput();
            return () => textarea.removeEventListener('input', handleInput);
        }
    }, []);


    return (
      <textarea
        className={cn(
          'flex min-h-[40px] max-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-y-auto',
          className
        )}
        ref={localRef}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
