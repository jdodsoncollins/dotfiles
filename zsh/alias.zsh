alias showall="defaults write com.apple.finder AppleShowAllFiles TRUE && killall Finder" 
alias hideall="defaults write com.apple.finder AppleShowAllFiles FALSE && killall Finder"

alias watchit='filewatcher "~/Code/Production/Core/" --spinner --dontwait --execute "syncnow"'
alias watch51='filewatcher "~/Code/5-1/Core/" --spinner --dontwait --execute "sync51now"'
