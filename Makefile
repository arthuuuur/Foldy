default: help


help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9\./_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'


prompt: # Prompt use when typing dangerous command
	@echo -n "Are you sure? [N/y] " && read ans && if [ $${ans:-'N'} = 'y' ]; then \
		printf $(_SUCCESS) "OK Continuing" ; \
		exit 0; \
	else \
	  	printf $(_ERROR) "KO" "Stopping" ; \
		exit 1 ; \
	fi

_SUCCESS := "\033[32m[%s]\033[0m %s\n" # Green text for "printf"
_ERROR := "\033[31m[%s]\033[0m %s\n" # Red text for "printf"

DOCKER=docker compose -p foldy -f ./docker-compose.yaml
NODE=$(DOCKER) node

start: ## Start the stack
	$(DOCKER) up -d --remove-orphans

start/recreate: ## Force recreate the stack
	$(DOCKER) up -d --force-recreate

start/rebuild: ## Force rebuild the stack
	$(DOCKER) up -d --force-recreate --build

build: ## Build the stack
	$(DOCKER) build

stop: ## Stop the stack
	$(DOCKER) stop

watch: ## devtools for docker
	$(DOCKER) watch