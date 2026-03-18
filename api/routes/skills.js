const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// GET /api/skills
// Read all skills from OpenClaw workspace and return metadata
router.get('/', async (req, res) => {
  try {
    const skillsPath = '/root/.openclaw/workspace/skills';
    
    // Check if skills directory exists
    try {
      await fs.access(skillsPath);
    } catch (error) {
      return res.json({
        success: true,
        skills: [],
        message: 'Skills directory not found'
      });
    }

    // Read all directories in skills folder
    const entries = await fs.readdir(skillsPath, { withFileTypes: true });
    const skillDirs = entries.filter(entry => entry.isDirectory());

    const skills = [];

    for (const dir of skillDirs) {
      const skillPath = path.join(skillsPath, dir.name);
      const skillMdPath = path.join(skillPath, 'SKILL.md');

      try {
        // Read SKILL.md file
        const skillContent = await fs.readFile(skillMdPath, 'utf8');
        
        // Extract name and description from SKILL.md
        const skill = parseSkillMetadata(skillContent, dir.name);
        
        if (skill) {
          skills.push({
            id: dir.name,
            name: skill.name || dir.name,
            description: skill.description || 'No description available',
            path: skillPath,
            lastModified: await getLastModified(skillMdPath)
          });
        }
      } catch (error) {
        console.warn(`Could not read SKILL.md for ${dir.name}:`, error.message);
        
        // Add skill with basic info even if SKILL.md is missing
        skills.push({
          id: dir.name,
          name: dir.name,
          description: 'SKILL.md not found',
          path: skillPath,
          lastModified: null,
          error: 'Missing SKILL.md'
        });
      }
    }

    // Sort skills alphabetically
    skills.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      skills,
      total: skills.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read skills',
      message: error.message
    });
  }
});

/**
 * Parse skill metadata from SKILL.md content
 */
function parseSkillMetadata(content, fallbackName) {
  try {
    const lines = content.split('\n');
    let name = fallbackName;
    let description = 'No description available';
    
    // Look for frontmatter
    if (content.startsWith('---')) {
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd > 0) {
        const frontmatter = content.substring(3, frontmatterEnd);
        const nameMatch = frontmatter.match(/name:\s*(.+)/);
        const descMatch = frontmatter.match(/description:\s*(.+)/);
        
        if (nameMatch) name = nameMatch[1].trim();
        if (descMatch) description = descMatch[1].trim();
        
        return { name, description };
      }
    }
    
    // Look for # header as name
    const headerMatch = content.match(/^#\s+(.+)/m);
    if (headerMatch) {
      name = headerMatch[1].trim();
    }
    
    // Look for description in common patterns
    const descPatterns = [
      /description:\s*(.+)/i,
      /^>\s*(.+)/m, // Quote style description
      /^##?\s*Description\s*\n(.+)/mi,
      /^##?\s*Overview\s*\n(.+)/mi
    ];
    
    for (const pattern of descPatterns) {
      const match = content.match(pattern);
      if (match) {
        description = match[1].trim();
        break;
      }
    }
    
    // If no description found, use first paragraph after headers
    if (description === 'No description available') {
      const paragraphMatch = content.match(/^(?!#)(.+)/m);
      if (paragraphMatch) {
        description = paragraphMatch[1].trim().substring(0, 200) + '...';
      }
    }
    
    return { name, description };
    
  } catch (error) {
    console.warn('Error parsing skill metadata:', error);
    return { 
      name: fallbackName, 
      description: 'Error parsing skill metadata' 
    };
  }
}

/**
 * Get last modified timestamp for a file
 */
async function getLastModified(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    return null;
  }
}

module.exports = router;