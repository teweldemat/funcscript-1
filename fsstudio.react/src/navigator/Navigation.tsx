// Navigation.tsx
import React, { useState } from 'react';
import { Drawer, List, Toolbar, Box, Tooltip, IconButton } from '@mui/material';
import NavItemComponent from './NavItemComponent'; // Ensure this path is correct
const drawerWidth = '20%';

interface NavigationProps { onSelected: (path: string) => void,initiallySelectedPath:string|null }

const Navigation: React.FC<NavigationProps> = ({onSelected,initiallySelectedPath}) => {
  const [selectedPath, setSelectedPath] = useState<string>(initiallySelectedPath??"");

  const handleSelect = (path: string) => {
    if (selectedPath !== path) {
      setSelectedPath(path);
      onSelected(path);
    }
  };


  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >

      <Box sx={{ overflow: 'auto' }}>
        <NavItemComponent   item={{ path: "/", name: "root", isFolder: true }} onDelete={() => { }} onRename={() => { }} selectedPath={selectedPath} onSelect={handleSelect} />
      </Box>
    </Drawer>
  );
};

export default Navigation;
