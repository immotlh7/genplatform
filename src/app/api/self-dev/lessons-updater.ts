import fs from 'fs/promises';

const LESSONS_FILE = '/root/.openclaw/workspace/memory/LESSONS.md';

/**
 * Append a lesson learned from a failed task to LESSONS.md
 */
export async function appendLesson(task: any, errorMessage: string): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const title = (task.originalDescription || 'Unknown task').substring(0, 60);
    const filePaths = (task.microTasks || [])
      .map((mt: any) => mt.filePath)
      .filter(Boolean)
      .join(', ');
    
    const lesson = `\n\n## Lesson ${date}: ${title}
Failed: ${title}
Files: ${filePaths || 'N/A'}
Error: ${errorMessage.substring(0, 200)}
Fix: Review the error above and avoid the same pattern in future tasks.`;

    let content = '';
    try { content = await fs.readFile(LESSONS_FILE, 'utf-8'); } catch {}
    
    content += lesson;
    await fs.writeFile(LESSONS_FILE, content);
  } catch {
    // Don't let lesson writing break execution
  }
}
