#!/bin/bash

# Script to export codebase into a single file for review

OUTPUT_FILE="codebase_export.txt"
ROOT_DIR="."
EXCLUDE_DIRS=("node_modules" ".git" "public" "dist" "build" "coverage") # Exclude directories with binaries or generated files
INCLUDE_EXTENSIONS=("ts" "tsx" "js" "jsx" "json" "css" "html" "md" "yml" "yaml") # Relevant file extensions

# Function to check if extension is included
is_included_extension() {
  local ext="$1"
  for incl in "${INCLUDE_EXTENSIONS[@]}"; do
    if [ "$ext" = "$incl" ]; then
      return 0
    fi
  done
  return 1
}

# Clear output file
> "$OUTPUT_FILE"

# Find and process files
find "$ROOT_DIR" -type f | while read -r file; do
  # Skip if in excluded dir
  skip=false
  for excl in "${EXCLUDE_DIRS[@]}"; do
    if [[ "$file" == *"/$excl/"* ]]; then
      skip=true
      break
    fi
  done
  if $skip; then continue; fi

  # Skip hidden files
  if [[ "$(basename "$file")" == .* ]]; then continue; fi

  # Skip package.json and package-lock.json
  basename="$(basename "$file")"
  if [[ "$basename" == "package.json" || "$basename" == "package-lock.json" ]]; then continue; fi

  # Get extension
  ext="${file##*.}"
  if ! is_included_extension "$ext"; then continue; fi

  # Append to output
  echo "=== $file ===" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "Export complete. Output file: $OUTPUT_FILE" 