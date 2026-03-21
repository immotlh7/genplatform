import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const IDEAS_PATH = path.join(process.cwd(), 'data', 'ideas.json');

async function getIdeas(): Promise<any[]> {
  try {
    const data = await fs.readFile(IDEAS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// GET /api/ideas — return all ideas from file
export async function GET() {
  try {
    const ideas = await getIdeas();
    return NextResponse.json(ideas);
  } catch (error) {
    console.error('Failed to fetch ideas:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/ideas — create a new idea stub
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ideas = await getIdeas();
    
    const newIdea = {
      id: Date.now().toString(),
      ideaText: body.ideaText || body.title || body.description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    ideas.push(newIdea);
    await fs.writeFile(IDEAS_PATH, JSON.stringify(ideas, null, 2));
    
    return NextResponse.json(newIdea, { status: 201 });
  } catch (error) {
    console.error('Failed to create idea:', error);
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
  }
}
