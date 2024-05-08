import React, { useState, useEffect, useRef } from 'react';
import { Grid, Typography, Tab, Tabs, Box, TextField, Toolbar, IconButton, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';

import EvalNodeComponent, { ExpressionType, NodeItem } from './EvalNodeComponent'; // Assuming EvalNodeComponent is in the same directory
import { SERVER_URL } from '../backend';
import axios from 'axios';
import TextLogger from './RemoteLogger';
import { json } from 'stream/consumers';
import { useCodeMirror } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

interface ErrorItem {
    type: string;
    message: string;
    stackTrace?: string;  
  }
  
  interface ErrorData {
    errors: ErrorItem[];
  }
  
const ExecutionView: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);
    const [expression, setExpression] = useState<string | null>(null);
    const [lastSavedExpression, setLastSavedExpression] = useState<string | null>(null);
    const [generalTextOutput, setGeneralTextOutput] = useState('');
    const [textLog, setTextLog] = useState('');
    const [tabIndex, setTabIndex] = useState(0);
    const [saveStatus, setSaveStatus] = useState('All changes saved');
    const [messages,setMessages]=useState<string[]>([])
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        setSelectedNode(null);
        setExpression(null);
        setMessages([]);
    }, [sessionId]);

    const handleNodeSelect = (nodePath: string) => {
        console.log('selected ' + nodePath);
        if (selectedNode && expression !== lastSavedExpression) {
            saveExpression(selectedNode.path!, expression,false);
        }
        axios.get(`${SERVER_URL}/api/sessions/${sessionId}/node`, { params: { nodePath } })
            .then(response => {
                setSelectedNode({...response.data, path: nodePath});
                console.log('fetched node data');
                console.log(response.data);
                setExpression(response.data.expression ?? "");
                setLastSavedExpression(response.data.expression);
                setSaveStatus('All changes saved');
            })
            .catch(error => console.error('Failed to fetch node:', error));
    };

    const handleExpressionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpression(event.target.value);
        setSaveStatus('Unsaved changes');
    };

    const handleExpressionBlur = () => {
        console.log('blur');
        if (selectedNode && expression !== lastSavedExpression) {
            saveExpression(selectedNode.path!, expression,false);
        }
    };

    const saveExpression = (nodePath: string, newExpression: string | null,thenEvalute:boolean) => {
        if (newExpression === null) return;
        axios.post(`${SERVER_URL}/api/sessions/${sessionId}/node/expression/${nodePath}`, { expression: newExpression })
            .then(() => {
                setLastSavedExpression(newExpression);
                setSaveStatus('All changes saved');
                if(thenEvalute)
                    executeExpression();
            })
            .catch(error => {
                console.error('Failed to save expression:', error);
                setSaveStatus('Failed to save changes');
            });
    };
    function formatErrorData(errorData: ErrorData): string {
        const errorsText = errorData.errors.map((error, index) => {
          return `Error ${index + 1}:\nType: ${error.type}\nMessage: ${error.message}\nStackTrace: ${error.stackTrace || 'N/A'}`;
        }).join('\n\n');
        return errorsText;
      }
      
      
    
    const executeExpression = () => {
        if (!selectedNode) return;
        if (selectedNode && expression === lastSavedExpression) {
            axios.get(`${SERVER_URL}/api/sessions/${sessionId}/node/value`, { params: { nodePath: selectedNode.path } })
                .then(response => {
                    if (typeof response.data === 'string') {
                        setGeneralTextOutput(response.data);
                    } else {
                        setGeneralTextOutput(JSON.stringify(response.data));
                    }
                    
                })
                .catch(error => {
                    console.error('Failed to evaluate expression:', error);
                    if (error.response) {
                        setGeneralTextOutput(formatErrorData(error.response.data as ErrorData));
                    } else {
                        setGeneralTextOutput('Failed to evaluate expression');
                    }
                });
        }
    };
    

    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:5091');
        websocket.onmessage = (event) => {
            console.log('ws'+event.data)
            var msg=JSON.parse(event.data);
            switch(msg.cmd)
            {
                case "log":
                    setTabIndex(1);
                    setMessages(prev => [...prev, msg.data]);
                    break;
                case "clear":
                    setMessages(prev=>[]);
                    break;
            }
            
        };
        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);
    
    const renderTabContent = () => {
        switch (tabIndex) {
            case 0:
                return <Typography variant="body1" gutterBottom><pre style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    border: '1px solid #ccc',
                    padding: '10px',
                    fontFamily: '"Lucida Console", monospace',
                  }}>{generalTextOutput}</pre></Typography>;
            case 1:
                return <TextLogger messages={messages}/>;
            default:
                return null;
        }
    };

    const editorRef = useRef<HTMLDivElement | null>(null);
    
    const { state, view }= useCodeMirror({
        container: editorRef.current!,
        value: expression || '',
        extensions: [javascript()],
        onChange:  value => {
            setExpression(value);
            setSaveStatus('Unsaved changes');
        },
        onBlur:handleExpressionBlur
    });
    
    useEffect(() => {
        if (view) {
            const blurHandler = () => {
                handleExpressionBlur();
            };

            // Attach the blur event listener
            view.dom.addEventListener('blur', blurHandler);

            // Cleanup function to remove the event listener
            return () => {
                view.dom.removeEventListener('blur', blurHandler);
            };
        }
    }, [view]); // Dependency on `view` to ensure re-binding if the view changes

    return (
        <Grid container spacing={2}>
            <Grid item xs={8}>
                <Toolbar>
                    <IconButton onClick={executeExpression} color="primary">
                        <PlayArrowIcon />
                    </IconButton>
                    <IconButton onClick={() => selectedNode && expression !== lastSavedExpression && saveExpression(selectedNode.path!, expression, false)} color="secondary">
                        <SaveIcon />
                    </IconButton>
                    <Typography variant="body2" color="textSecondary" style={{ flexGrow: 1, paddingLeft: 10 }}>
                        {saveStatus}
                    </Typography>
                </Toolbar>
                <div ref={editorRef} style={{ height: '200px',overflow: 'auto', border: '1px solid #ccc' }} />
                <Tabs value={tabIndex} onChange={(event, newValue) => setTabIndex(newValue)} aria-label="Data tabs">
                    <Tab label="General Text Output" />
                    <Tab label="Log" />
                </Tabs>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {renderTabContent()}
                </Box>
            </Grid>
            <Grid item xs={4}>
                <EvalNodeComponent
                    node={{
                        name: "Root Node",
                        expressionType: ExpressionType.FuncScript,
                        childrenCount: 0,
                        expression: null,
                    }}
                    sessionId={sessionId}
                    onSelect={handleNodeSelect}
                    onModify={() => {}}
                    selectedNode={selectedNode?.path}
                />
            </Grid>
        </Grid>
    );
};

export default ExecutionView;
