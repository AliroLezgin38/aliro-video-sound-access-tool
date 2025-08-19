#!/usr/bin/env bash
set -euo pipefail

# Cloud Shell genelde Node yüklü gelir, yoksa nvm ile kurar
if ! command -v node >/dev/null 2>&1; then
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
	# shellcheck disable=SC1090
	. "$HOME/.nvm/nvm.sh"
	nvm install --lts
	nvm use --lts
fi

npm install
npm run start 