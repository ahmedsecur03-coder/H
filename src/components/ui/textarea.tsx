
import * as React from 'react';

import {cn} from '@/lib/utils';
import { useImperativeHandle, useRef, useEffect } from 'react';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    useEffect(() => {
        const textarea = localRef.current;
        if (textarea) {
            const handleInput = () => {
                textarea.style.height = 'auto';
                // Add a buffer for the final height to prevent scrollbar flicker
                textarea.style.height = `${textarea.scrollHeight + 2}px`;
            };
            
            // Run on mount, on change, and when the component is focused
            textarea.addEventListener('input', handleInput);
            textarea.addEventListener('focus', handleInput);

            // Initial resize
            handleInput();
            
            return () => {
                textarea.removeEventListener('input', handleInput);
                textarea.removeEventListener('focus', handleInput);
            }
        }
    }, [props.value]); // Re-run effect if external value changes


    return (
      <textarea
        className={cn(
          'flex min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden',
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
