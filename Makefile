.PHONY: help setup up down logs clean seed lint test web-dev api-dev

PYTHON ?= python3.11

help:
	@echo "HELIOS Local Development Commands"
	@echo "--------------------------------"
	@echo "make setup    - Install dependencies for web and api"
	@echo "make up       - Start all services via docker-compose"
	@echo "make down     - Stop all services"
	@echo "make logs     - Tail logs for all services"
	@echo "make clean    - Remove node_modules, python caches, and data volumes"
	@echo "make seed     - Run the database and DuckDB dataset seeding script"
	@echo "make lint     - Run linters on frontend and backend"
	@echo "make test     - Run all automated tests"
	@echo "make web-dev  - Run the Next.js frontend locally"
	@echo "make api-dev  - Run the FastAPI backend locally"

setup:
	@echo "Setting up HELIOS..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; fi
	@cd apps/web && npm install
	@cd apps/api && $(PYTHON) -m venv venv && ./venv/bin/pip install -r requirements.txt

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	find . -type d -name "node_modules" -exec rm -rf {} +
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +

seed:
	@echo "Seeding databases..."
	@cd apps/api && ./venv/bin/python ../../scripts/seed/seed_data.py

test:
	@cd apps/api && ./venv/bin/pytest -q
	@cd apps/web && npm run build

web-dev:
	@cd apps/web && npm run dev

api-dev:
	@cd apps/api && ./venv/bin/uvicorn app.main:app --reload --port 8000
