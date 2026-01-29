# Makefile pour faciliter l'utilisation de Docker

.PHONY: help dev prod build stop logs clean convert test

help: ## Affiche l'aide
	@echo "Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

check-docker: ## Vérifie que Docker est démarré
	@./scripts/check-docker.sh

start-docker: ## Démarre Docker Desktop (macOS)
	@./scripts/start-docker.sh

dev: ## Lance l'application en mode développement
	docker-compose -f docker-compose.dev.yml up

dev-build: ## Lance l'application en mode développement avec rebuild
	docker-compose -f docker-compose.dev.yml up --build

dev-bg: ## Lance l'application en mode développement en arrière-plan
	docker-compose -f docker-compose.dev.yml up -d

prod: ## Lance l'application en mode production
	docker-compose -f docker-compose.prod.yml up -d

prod-build: ## Lance l'application en mode production avec rebuild
	docker-compose -f docker-compose.prod.yml up --build -d

stop: ## Arrête tous les conteneurs
	docker-compose -f docker-compose.dev.yml -f docker-compose.prod.yml down

stop-volumes: ## Arrête tous les conteneurs et supprime les volumes
	docker-compose -f docker-compose.dev.yml -f docker-compose.prod.yml down -v

logs: ## Affiche les logs du conteneur de développement
	docker-compose -f docker-compose.dev.yml logs -f

logs-prod: ## Affiche les logs du conteneur de production
	docker-compose -f docker-compose.prod.yml logs -f

clean: ## Nettoie les images et conteneurs non utilisés
	docker-compose -f docker-compose.dev.yml -f docker-compose.prod.yml down -v
	docker system prune -f

convert: ## Convertit le fichier Excel en JSON (utilise le fichier corrigé par défaut)
	docker-compose run --rm converter python3 scripts/convert_excel_to_json.py trdata/Interface_Effectifs_DIRM_Central_V6_corrected.xlsx

convert-file: ## Convertit un fichier Excel spécifique (usage: make convert-file FILE=trdata/mon_fichier.xlsx)
	docker-compose run --rm converter python3 scripts/convert_excel_to_json.py $(FILE)

analyze: ## Analyse les fichiers Excel
	docker-compose run --rm converter python3 scripts/analyze_excel.py

shell: ## Ouvre un shell dans le conteneur de développement
	docker exec -it statdirm-dev sh

shell-prod: ## Ouvre un shell dans le conteneur de production
	docker exec -it statdirm-prod sh

build-image: ## Construit l'image Docker de production
	docker build --target production -t statdirm:latest .

build-image-dev: ## Construit l'image Docker de développement
	docker build --target development -t statdirm-dev:latest .

stats: ## Affiche les statistiques d'utilisation des conteneurs
	docker stats

test: ## Lance les tests (si disponibles)
	docker exec -it statdirm-dev npm test

install: ## Installe une dépendance npm (usage: make install PKG=nom-du-package)
	docker exec -it statdirm-dev npm install $(PKG)
