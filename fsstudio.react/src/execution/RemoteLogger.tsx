// RemoteLogger.tsx

import React, { useEffect, useState } from 'react';

const RemoteLogger: React.FC<{messages:string[]}> = ({messages}) => {
    return (
        <div>
            <ul>
                {messages.map((message, index) => (
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        border: '1px solid #ccc',
                        padding: '10px',
                        fontFamily: '"Lucida Console", monospace',
                      }}
                      key={index}>{message}</pre>
                ))}
            </ul>
        </div>
    );
};

export default RemoteLogger;
