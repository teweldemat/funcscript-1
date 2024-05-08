import React, { useState, useEffect, useRef } from 'react';
import {
    ListItem, ListItemIcon, ListItemText, Collapse, List, Box, IconButton,
    Menu, MenuItem, TextField, Dialog, DialogTitle, Button, DialogActions,
    DialogContent, DialogContentText, InputBaseComponentProps
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { SERVER_URL } from '../backend';

export interface NodeItem {
    name: string;
    expressionType: ExpressionType;
    childrenCount: number;
    path?: string;
    expression: string | null;
}

export enum ExpressionType {
    ClearText = "ClearText",
    FuncScript = "FuncScript",
    FuncScriptTextTemplate = "FuncScriptTextTemplate"
}

interface EvalNodeComponentProps {
    node: NodeItem;
    sessionId: string;
    onSelect: (path: string) => void;
    onModify: () => void;
    selectedNode?: string;
}

const EvalNodeComponent: React.FC<EvalNodeComponentProps> = ({ node, sessionId, onSelect, onModify, selectedNode }) => {
    const [children, setChildren] = useState<NodeItem[]>([]);
    const [open, setOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [renameMode, setRenameMode] = useState(false);
    const [renamedName, setRenamedName] = useState(node.name);
    const [newInputMode, setNewInputMode] = useState(false);
    const [newName, setNewName] = useState('');
    const [newNodeType, setNewNodeType] = useState<ExpressionType>(ExpressionType.FuncScript);
    const [deleteItem, setDeleteItem] = useState<boolean>(false);

    const renameInputRef = useRef<InputBaseComponentProps['inputRef']>(null);
    const newInputRef = useRef<InputBaseComponentProps['inputRef']>(null);

    useEffect(() => {
        if (renameMode && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renameMode]);

    useEffect(() => {
        if (newInputMode && newInputRef.current) {
            newInputRef.current.focus();
            newInputRef.current.select();
        }
    }, [newInputMode]);

    useEffect(() => {
       if (!node.path || open) {
            fetchChildren();
        }
    }, [node.path, open,sessionId]);  

    const handleToggleExpand = () => {
        setOpen(!open);
    };

    const handleSelect = () => {
        onSelect(node.path!);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleEdit = () => {
        setRenameMode(true);
        handleCloseMenu();
    };

    const handleDelete = () => {
        axios.delete(`${SERVER_URL}/api/sessions/${sessionId}/node`, { params: { nodePath: node.path } })
            .then(response => {
                console.log('Node deleted:', response.data);
                onModify(); // Trigger parent to refresh the node list
            })
            .catch(error => console.error('Failed to delete node:', error));
        handleCloseMenu();
    };

    const handleApplayRename = () => {
        axios.post(`${SERVER_URL}/api/sessions/${sessionId}/node/rename`, {
            nodePath: node.path,
            newName: renamedName
        }).then(response => {
            console.log('Expression updated:', response.data);
            setRenameMode(false);
            onModify();
        }).catch(error => {
            console.error('Error updating expression:', error);
        });
    };

    const handleDeleteItem = () => {

        axios.delete(`${SERVER_URL}/api/sessions/${sessionId}/node`, {
            params: {
                nodePath: node.path,
            }
        }).then(response => {
            console.log('Node deleted:', response.data);
            setDeleteItem(false);
            onModify();
        }).catch(error => {
            console.error('Error deleteing node:', error);
        });
    };

    const fetchChildren = () => {
        axios.get<NodeItem[]>(`${SERVER_URL}/api/sessions/${sessionId}/node/children`, { params: { nodePath: node.path } })
            .then(response => {
                const chs = response.data.map(x => {
                    return { ...x, path: (node.path ? node.path + "." : "") + x.name }
                });
                setChildren(chs);
            })
            .catch(error => console.error('Failed to fetch children:', error));
    };

    const handleMenuAction = (action: string) => {
        handleCloseMenu();
        switch (action) {
            case 'add-standard':
            case 'add-text':
            case 'add-text-template':
                setNewInputMode(true);
                setNewNodeType(action === 'add-standard' ? ExpressionType.FuncScript : action === 'add-text' ? ExpressionType.ClearText : ExpressionType.FuncScriptTextTemplate);
                break;
            case 'rename':
                setRenameMode(true);
                setRenamedName(node.name);
                break;
            case 'delete':
                setDeleteItem(true)
                break;
            default:
                break;
        }
    };

    const handleAddItem = () => {
        if (newName.trim() !== '') {
            axios.post(`${SERVER_URL}/api/sessions/${sessionId}/node`, {
                ParentNodePath: node.path,
                Name: newName,
                ExpressionType: newNodeType,
                Expression: ""  // Ensure this is correctly formatted or required as per backend expectation
            })
                .then(response => {
                    console.log(`${newNodeType} created: `, response.data);
                    fetchChildren();
                    setNewName('');
                    setNewInputMode(false);
                })
                .catch(error => {
                    console.error('Error creating item:', error);
                    alert('Failed to create item: ' + error.message);
                });
        }
    };

    const isRoot = !node.path;
    const menuItems = (isRoot ? ["Add Standard", "Add Text", "Add Text Template"] : ["Add Standard", "Add Text", "Add Text Template", "Rename", "Delete"]);
    return (
        <>
            <ListItem onClick={handleSelect} 
            sx={{
                display: 'flex', alignItems: 'center', width: '100%',

                backgroundColor:(selectedNode &&  node.path === selectedNode) ? 'lightgray' : 'inherit', // Highlight the selected item
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'lightblue' // Color change on hover
                }

            }}
            >
                <IconButton onClick={handleMenuClick} size="small">
                    <MoreVertIcon />
                </IconButton>
                <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu}>
                    {menuItems.map(mi => (<MenuItem key={mi} onClick={() => handleMenuAction(mi.toLowerCase().replace(' ', '-'))}>{mi}</MenuItem>))}
                </Menu>
                {!isRoot && (<>
                    <IconButton onClick={handleToggleExpand} size="small">
                        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <ListItemIcon>
                        {node.expressionType === ExpressionType.FuncScript ? <EditIcon /> : <FolderIcon />}
                    </ListItemIcon>
                    {!renameMode ? (
                        <ListItemText primary={node.name} />
                    ) : (
                        <TextField
                            size="small"
                            value={renamedName}
                            onChange={(e) => setRenamedName(e.target.value)}
                            autoFocus
                            inputRef={renameInputRef}

                            onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                    handleApplayRename();
                                else if (e.key === "Escape")
                                    setRenameMode(false);
                            }}
                        />
                    )}
                </>)}
                {isRoot &&(<ListItemText primary="Nodes" />)}
            </ListItem>
            {newInputMode && (
                <Box pl={isRoot ? 0 : 4}>
                    <TextField
                        size="small"
                        label={`Enter name`}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter')
                                handleAddItem();
                            else if (e.key === "Escape")
                                setNewInputMode(false);
                        }}
                        autoFocus
                        inputRef={newInputRef}
                    />
                </Box>
            )}
            {(open || isRoot) && (
                <Collapse in={open || isRoot} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {children.map((child, index) => (
                            <Box key={index} pl={isRoot?0:4}>
                                <EvalNodeComponent
                                    node={child}
                                    sessionId={sessionId}
                                    onSelect={onSelect}
                                    onModify={()=>fetchChildren()}
                                    selectedNode={selectedNode}
                                />
                            </Box>
                        ))}
                    </List>
                </Collapse>
            )}
            <Dialog
                open={deleteItem}
                onClose={() => setDeleteItem(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete {node.name}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteItem(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteItem} color="primary" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EvalNodeComponent;
