#! /usr/bin/env bash

apt-get update
apt-get install git curl build-essential python2.7 # for building native node modules
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
source ~/.bashrc
nvm install 0.12.5
node --version
npm install -g kval pm2
kval start
