#!/bin/sh

## INSTALL HOMEBREW WITH THE FOLLOWING LINE
## First you need to install XCode and agree
## to the terms and service
# ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

brew tap homebrew/dupes
brew tap caskroom/versions

brew install bash
brew install curl
brew install git
brew install phantomjs
brew install rsync
brew install svn
brew install tmux
brew install vim
brew install wget
brew install youtube-dl
brew install zsh

brew cask install 1password
brew cask install alfred
brew cask install appcleaner
brew cask install atom
brew cask install bartender
brew cask install cornerstone
brew cask install dropbox
brew cask install fantastical
brew cask install firefox
brew cask install flux
brew cask install google-chrome
brew cask install handbrake
brew cask install handbrakecli
brew cask install iterm2
brew cask install keepingyouawake
brew cask install libreoffice
brew cask install macvim
brew cask install paw
brew cask install sequel-pro
brew cask install slack
brew cask install sourcetree
brew cask install spectacle
brew cask install spotify
brew cask install sublime-text3
brew cask install the-unarchiver
brew cask install transmission
brew cask install transmit
brew cask install vagrant
brew cask install vagrant-manager
brew cask install virtualbox
brew cask install viscosity
brew cask install vlc