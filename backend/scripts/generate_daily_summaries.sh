#!/bin/bash

PROJECT_DIR="/Users/andremarques/Desktop/Uni/PI/backend"

cd "$PROJECT_DIR" || exit 1

source venv/bin/activate

python manage.py generate_daily_summaries