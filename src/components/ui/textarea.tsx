

import * as React from 'react';

import {cn} from '@/lib/utils';
import { useImperativeHandle, useRef, useEffect } from 'react';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    const handleInput = () => {
        const textarea = localRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            // Add a buffer for the final height to prevent scrollbar flicker
            textarea.style.height = `${textarea.scrollHeight + 2}px`;
        }
    };
    
    useEffect(() => {
        handleInput();
    }, [props.value]);


    return (
      <textarea
        className={cn(
          'flex min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden',
          className
        )}
        ref={localRef}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
