#! /usr/bin/env bash

sudo apt-get update -y
sudo apt-get install -y git curl build-essential python2.7 # for building native node modules
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | NVM_DIR=/usr/local/nvm bash
source ~/.bashrc
nvm install node
node --version
npm install -g pm2
git clone https://bitbucket.org/ruffrey/kval.git ~/kval
cd kval
npm i --production
pm2 start db-config.json
pm2 startup
