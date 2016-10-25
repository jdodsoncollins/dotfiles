# Advanced Aliases.
# Use with caution
#

# ls, the common ones I use a lot shortened for rapid fire usage
alias l='ls -lFh'     #size,show type,human readable
alias la='ls -lAFh'   #long list,show almost all,show type,human readable
alias lr='ls -tRFh'   #sorted by date,recursive,show type,human readable
alias lt='ls -ltFh'   #long list,sorted by date,show type,human readable
alias ll='ls -lFh'      #long list
alias ldot='ls -ld .*'

alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Tmux
alias ta='tmux attach -t'
alias tn='tmux new -s'
alias tl='tmux list-sessions'
alias tls='tmux list-sessions'

alias glog="git log --graph --pretty=format:'%Cred%h%Creset %an: %s - %Creset %C(yellow)%d%Creset %Cgreen(%cr)%Creset' --abbrev-commit --date=relative"
alias gaa='git add . '
alias gcm='git commit -m '
alias gb='git branch'
