# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="robbyrussell"

plugins=(git)

source "$ZSH/oh-my-zsh.sh"

# nvm is the primary Node version manager (asdf is installed but unused).
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
export PATH=./bin:$PATH

# Function for spinning up review app for nextjs
function next-ra() {
  # variable for local current branch name
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"

  if [ "$1" != "" ]
  then
    echo -e 'Setting env vars on review app:' $1
    heroku config:set APP_TYPE=production APP_BASE=web API_URL=https://nextjs-to-rails.masterclass.dev -a $1

    echo -e 'Triggering a new deploy (this might take a while)...'
    heroku git:remote -a $1
    git push heroku $BRANCH:main

    echo -e '\e[33;1mConverted '$1' to a NextJS Review app. View your deploy here: https://dashboard.heroku.com/apps/'$1'/deploy/github'
    git remote rm heroku
  else
    echo -e '\e[33;1mEnter the name of your review app when running this command: nextapp review-app-name'
  fi
}

if [ -d /opt/homebrew/opt/postgresql@17/bin ]; then
  export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
fi

# Load Angular CLI autocompletion (only if ng is installed)
if command -v ng &>/dev/null; then
  source <(ng completion script)
fi

# Load GitHub Copilot CLI aliases (only if installed)
if command -v github-copilot-cli &>/dev/null; then
  eval "$(github-copilot-cli alias -- "$0")"
fi

# pyenv configuration
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# ngrok completion
if command -v ngrok &>/dev/null; then
  eval "$(ngrok completion)"
fi

export PATH="$HOME/.local/bin:$PATH"

# Added by Antigravity
if [ -d "$HOME/.antigravity/antigravity/bin" ]; then
  export PATH="$HOME/.antigravity/antigravity/bin:$PATH"
fi

# >>> grok installer >>>
export PATH="$HOME/.grok/bin:$PATH"
fpath=(~/.grok/completions/zsh $fpath)
autoload -Uz compinit && compinit -C
# <<< grok installer <<<

# OpenCode
export PATH="$HOME/.opencode/bin:$PATH"

# Herdr Automatic Rename: per-command tab naming (herdr plugin)
for _f in ${HOME}/.config/herdr/plugins/github/herdr-automatic-rename-*/shell/hook.zsh(N); do
  source $_f; break
done
