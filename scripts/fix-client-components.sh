#!/bin/bash

# Add "use client" directive to component files that use React hooks
echo "Adding 'use client' directive to components..."

# Auth components
for file in src/components/auth/*.tsx; do
  if [ -f "$file" ]; then
    # Check if file doesn't already have "use client" directive
    if ! grep -q "\"use client\"" "$file"; then
      # Insert "use client" directive at the beginning of the file
      sed -i '1s/^/"use client";\n\n/' "$file"
      echo "Added 'use client' directive to $file"
    fi
  fi
done

# Insights components
for file in src/components/insights/*.tsx; do
  if [ -f "$file" ]; then
    if ! grep -q "\"use client\"" "$file"; then
      sed -i '1s/^/"use client";\n\n/' "$file"
      echo "Added 'use client' directive to $file"
    fi
  fi
done

echo "Client component fixes complete!"
