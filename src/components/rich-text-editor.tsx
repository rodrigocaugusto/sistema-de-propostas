'use client';

import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync value to innerHTML when value changes externally (and not focused or different enough)
    // Determining when to update is the trickiest part of a controlled contentEditable.
    // We'll update only if the content is significantly different to avoid cursor jumps,
    // or if the editor is empty and we have a value.
    useEffect(() => {
        if (isMounted && editorRef.current) {
            if (editorRef.current.innerHTML !== value) {
                // To prevent cursor jumping during typing, we might strictly rely on onInput to update state
                // and only update ref if they mismatch significantly? 
                // For now, straightforward replacement.
                // A better approach for a simple editor is to only update if document.activeElement !== editorRef.current
                if (document.activeElement !== editorRef.current) {
                    editorRef.current.innerHTML = value;
                }
            }
        }
    }, [value, isMounted]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html === '<br>' ? '' : html);
        }
    };

    const execCommand = (command: string, formattedValue: string | undefined = undefined) => {
        document.execCommand(command, false, formattedValue);
        // Force update
        handleInput();
        editorRef.current?.focus();
    };

    if (!isMounted) {
        return <div className={cn("border rounded-md h-[150px] bg-muted/10", className)} />;
    }

    return (
        <div className={cn("border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900", className)}>
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <Bold className="h-4 w-4" />
                </Button>
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <List className="h-4 w-4" />
                </Button>
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button type='button' variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <AlignRight className="h-4 w-4" />
                </Button>
            </div>
            <div
                ref={editorRef}
                className="p-4 min-h-[150px] outline-none prose prose-sm max-w-none dark:prose-invert"
                contentEditable
                onInput={handleInput}
                data-placeholder={placeholder}
            />
            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
