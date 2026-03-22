#!/bin/bash
set -e
if [ -f /workspaces/.env ]; then
    export $(grep -v '^#' /workspaces/.env | xargs)
fi

git config --global user.name "$GIT_USER_NAME"
git config --global user.email "$GIT_USER_EMAIL"

git config --global credential.helper store
echo "https://$GITHUB_USER:$GITHUB_PAT@github.com" > ~/.git-credentials

echo "git configured"