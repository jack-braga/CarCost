#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Starting CARCOST development environment... 🚀"
echo "----------------------------------------"

# --- Variables to store PIDs ---
DJANGO_PID=""
VITE_PID="" # Vite will be foreground, but useful for a consistent cleanup

# --- Trap for Ctrl+C (SIGINT) ---
cleanup() {
    echo -e "\n🛑 Caught Ctrl+C! Shutting down servers gracefully... 🛑"

    if [ -n "$DJANGO_PID" ]; then
        echo "👋 Stopping Django development server (PID: $DJANGO_PID)..."
        kill "$DJANGO_PID" || true # Use || true to prevent script from exiting if process already died
        wait "$DJANGO_PID" 2>/dev/null || true # Wait for process to terminate, suppressing error if it's already gone
    fi

    echo "✅ Cleanup complete. Exiting. See ya! 👋"
    exit 0 # Exit the script gracefully
}

# Set the trap: When SIGINT (Ctrl+C) is received, call the 'cleanup' function
trap cleanup SIGINT

# --- Backend Setup and Start ---
echo "1. 🐍 Navigating to backend directory..."
cd backend

# Define the path to the virtual environment's Python executable
VENV_PYTHON="./venv/bin/python"

# Check if the virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv' because it wasn't found... 🌳"
    python3 -m venv venv
else
    echo "Virtual environment 'venv' already exists. Skipping creation. 👍"
fi

echo "📦 Activating virtual environment and installing backend packages... This might take a moment. ⏳"
"$VENV_PYTHON" -m pip install --upgrade pip
"$VENV_PYTHON" -m pip install -r requirements.txt

echo "⚙️ Running Django database migrations... Making sure your database is up to date! 💾"
"$VENV_PYTHON" manage.py migrate

echo "🚀 Starting Django development server (http://127.0.0.1:8000/)... Keep an eye on this port! 👀"
# Run Django server in the background
"$VENV_PYTHON" manage.py runserver &
DJANGO_PID=$! # Capture the PID of the last backgrounded process

echo "Django server started in the background. PID: $DJANGO_PID. You can access it now! 🌐"
echo "----------------------------------------"

# --- Frontend Setup and Start ---
echo "2. 🌐 Navigating to frontend directory..."
# Navigate back to the root CARCOST directory first, then into frontend
cd ../frontend

echo "dependencies 📥 Installing frontend Node.js packages... Grab a coffee! ☕"
npm install

echo "⚡ Starting Vite development server (usually http://localhost:5173/)... Happy coding! ✨"
# Run Vite server in the foreground. This command will keep the terminal occupied,
# and will directly receive Ctrl+C. The trap will also activate as a backup.
npm run dev

# The script will remain running as long as 'npm run dev' is active.
# When 'npm run dev' is killed by Ctrl+C, the trap will still trigger for cleanup.

# This line is theoretically unreachable as npm run dev takes over,
# but it's here for completeness if npm run dev somehow exits quickly.
wait # Wait for all background jobs to finish (which should just be Django)