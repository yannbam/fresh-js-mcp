#!/bin/bash
# Start the MCP server in pipe mode

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$DIR/.." && pwd )"

# Create pipes if they don't exist
PIPE_IN=".js-mcp-in"
PIPE_OUT=".js-mcp-out"

echo "Creating named pipes if they don't exist..."
[ -p "$PIPE_IN" ] || mkfifo "$PIPE_IN"
[ -p "$PIPE_OUT" ] || mkfifo "$PIPE_OUT"

echo "Starting JavaScript MCP server in pipe mode..."

# Start the server with the pipe mode option
cd "$REPO_ROOT" && node dist/index.js --pipe

# Remove pipes on exit
trap "rm -f $PIPE_IN $PIPE_OUT" EXIT
