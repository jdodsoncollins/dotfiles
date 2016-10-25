alias sudo='sudo '

# become root #
alias root='sudo -i'
alias su='sudo -i'

alias ..='cd ..'
alias ...='cd ../../../'
alias ....='cd ../../../../'

# reboot / halt / poweroff
alias reboot='sudo reboot'
alias poweroff='sudo poweroff'
alias halt='sudo halt'
alias shutdown='sudo shutdown'

# Alter the cp command
alias cp='cp -p'
alias mkdir='mkdir -p'
alias vi='vim'

alias ba='vim ~/.bash_aliases'
alias fstab='sudo vim /etc/fstab'
alias samba='sudo vim /etc/samba/smb.conf'
alias afp='sudo vim /usr/local/etc/afp.conf'


## set some other defaults ##
alias df='df -H'
alias du='du -ch'
alias hdd='sudo hdparm -C /dev/sd[a-l]'
alias label='sudo e2label'

alias stats='sudo inxi -Fxz'
alias diskfree='ncdu'
