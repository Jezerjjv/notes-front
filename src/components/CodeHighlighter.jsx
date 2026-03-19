import React from 'react';
import { Box, Typography } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeHighlighter = ({ language = 'text', codeText = '' }) => {
    return (
        <Box sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #30363d', p: 2 }}>
            <Typography
                variant="caption"
                sx={{
                    display: 'block',
                    color: 'text.secondary',
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
            >
                {language}
            </Typography>
            <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{ margin: 0, padding: '14px 16px', fontSize: '0.9rem' }}
                    wrapLongLines
                >
                    {codeText}
                </SyntaxHighlighter>
            </Box>
        </Box>
    );
};

export default CodeHighlighter;
