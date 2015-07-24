#! /usr/bin/env bash

sudo apt-get update -y
sudo apt-get install -y git curl build-essential python2.7
curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -
sudo apt-get install -y nodejs
cd /opt
git clone https://bitbucket.org/ruffrey/kval.git kval --force
cd kval
npm i --production
sudo cp -f kval.conf /etc/init
sudo chmod +x /etc/init/kval.conf
