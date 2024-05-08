// ContentPanel.tsx
import React from 'react';
import { Box, Toolbar, Typography } from '@mui/material';

const ContentPanel = () => {
  return (
    <Box
      component="main"
      sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
    >
      <Typography paragraph>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Typography>
      <Typography paragraph>
        More content goes here!
      </Typography>
    </Box>
  );
};

export default ContentPanel;
