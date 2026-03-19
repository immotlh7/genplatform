#!/bin/bash

# Find all client-side pages
for file in $(find src/app -name "page.tsx" -exec grep -l "'use client'" {} \;); do
  echo "Processing: $file"
  
  # Create temp file with the fix
  {
    head -n 1 "$file"  # Keep 'use client'
    echo ""
    echo "export const runtime = 'edge'"
    tail -n +2 "$file"  # Rest of the file
  } > "$file.tmp"
  
  # Replace original
  mv "$file.tmp" "$file"
done