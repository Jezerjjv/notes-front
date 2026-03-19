import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

const WysiwygMarkdownEditor = ({ value, onChange, height = 360 }) => {
    const containerRef = useRef(null);
    const editorInstanceRef = useRef(null);
    const lastEmittedMarkdownRef = useRef('');
    const initialValueRef = useRef(value || '');

    useEffect(() => {
        if (!containerRef.current || editorInstanceRef.current) return undefined;

        const editor = new Editor({
            el: containerRef.current,
            height: `${height}px`,
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            hideModeSwitch: true,
            theme: 'dark',
            usageStatistics: false,
            initialValue: initialValueRef.current,
        });

        editor.on('change', () => {
            const markdown = editor.getMarkdown();
            lastEmittedMarkdownRef.current = markdown;
            onChange?.(markdown);
        });

        editorInstanceRef.current = editor;

        return () => {
            editorInstanceRef.current?.destroy();
            editorInstanceRef.current = null;
        };
    }, [height, onChange]);

    useEffect(() => {
        const editor = editorInstanceRef.current;
        if (!editor) return;

        const nextMarkdown = value || '';

        // Ignore prop updates that come from this same editor change cycle.
        if (nextMarkdown === lastEmittedMarkdownRef.current) {
            return;
        }

        const currentMarkdown = editor.getMarkdown();
        if (currentMarkdown !== nextMarkdown) {
            editor.setMarkdown(nextMarkdown, false);
        }
    }, [value]);

    return (
        <Box
            sx={{
                '& .toastui-editor-defaultUI': {
                    borderRadius: 2,
                    borderColor: 'divider',
                },
                '& .toastui-editor-toolbar': {
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                },
                '& .toastui-editor-contents': {
                    fontFamily: '"Orbitron", "Rajdhani", "Roboto Mono", "Segoe UI", sans-serif',
                    fontSize: '0.95rem',
                },
            }}
        >
            <div ref={containerRef} />
        </Box>
    );
};

export default WysiwygMarkdownEditor;
