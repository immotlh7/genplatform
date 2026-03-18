const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// GET /api/memory - Read memory directory recursively
router.get('/', async (req, res) => {
  try {
    const memoryPath = '/root/.openclaw/workspace/memory';
    
    // Check if memory directory exists
    try {
      await fs.access(memoryPath);
    } catch (error) {
      return res.json({
        success: true,
        fileTree: {},
        message: 'Memory directory not found'
      });
    }

    const fileTree = await buildFileTree(memoryPath);

    res.json({
      success: true,
      fileTree,
      basePath: memoryPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading memory directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read memory directory',
      message: error.message
    });
  }
});

// GET /api/memory/file?path=... - Read specific file content
router.get('/file', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing path parameter'
      });
    }

    const fullPath = path.join('/root/.openclaw/workspace/memory', filePath);
    
    // Security check - ensure path is within memory directory
    const memoryPath = path.resolve('/root/.openclaw/workspace/memory');
    const resolvedPath = path.resolve(fullPath);
    
    if (!resolvedPath.startsWith(memoryPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Path outside memory directory'
      });
    }

    try {
      // Check if file exists and get stats
      const stats = await fs.stat(resolvedPath);
      
      if (stats.isDirectory()) {
        // Return directory listing
        const files = await fs.readdir(resolvedPath, { withFileTypes: true });
        const listing = files.map(file => ({
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file',
          path: path.join(filePath, file.name)
        }));

        return res.json({
          success: true,
          type: 'directory',
          path: filePath,
          listing,
          stats: {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString()
          }
        });
      } else {
        // Read file content
        const content = await fs.readFile(resolvedPath, 'utf8');
        
        return res.json({
          success: true,
          type: 'file',
          path: filePath,
          content,
          stats: {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString()
          }
        });
      }

    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: `Could not read: ${filePath}`
      });
    }

  } catch (error) {
    console.error('Error reading memory file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read memory file',
      message: error.message
    });
  }
});

/**
 * Build recursive file tree
 */
async function buildFileTree(dirPath, relativePath = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tree = {};

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        tree[entry.name] = {
          type: 'directory',
          path: entryRelativePath,
          children: await buildFileTree(fullPath, entryRelativePath)
        };
      } else {
        const stats = await fs.stat(fullPath);
        tree[entry.name] = {
          type: 'file',
          path: entryRelativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString()
        };
      }
    }

    return tree;
  } catch (error) {
    console.warn(`Could not read directory ${dirPath}:`, error.message);
    return {};
  }
}

module.exports = router;