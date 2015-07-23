#! /usr/bin/env bash

NODE_V=0.12.7

sudo su
apt-get update -y
apt-get install -y git curl build-essential python2.7 # for building native node modules
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
. ~/.nvm/nvm.sh
nvm install $NODE_V
nvm use $NODE_V
npm install -g pm2
git clone https://bitbucket.org/ruffrey/kval.git ~/kval
cd kval
npm i --production
pm2 start db-config.json
sudo env PATH=$PATH:/home/$USER/.nvm/versions/node/v$NODE_V/bin pm2 startup linux -u $USER
