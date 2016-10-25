PATH="$PATH:$HOME/.composer/vendor/bin"
PATH="$PATH:$HOME/.dotfiles/bin"
PATH="$PATH:$HOME/.rvm/bin" # Add RVM to PATH for scripting
PATH="$PATH:$HOME/bin"

# Load NVM
export NVM_DIR=$HOME/.nvm
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
