#!/usr/bin/env bash
# Wrapper so systemd doesn't need to know the exact nvm node version.
# Sources nvm and execs the default node — update nvm as usual, no service edit needed.
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh" --no-use
exec "$(nvm which default)" dist/index.js
