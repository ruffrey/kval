#! /usr/bin/env bash

CONF_DIR=/etc/init
CONF_FILE=$CONF_DIR/kval.conf
LOG_DIR=/var/log/kval
LOG_FILE="$LOG_DIR/kval.log"
LOGROTATE_FILE=/etc/logrotate.d/kval
LOGROTATE_CONFIG="$LOG_FILE {
    weekly
    rotate 26
    size 10M
    create
    su root
    compress
    delaycompress
    postrotate
        service kval restart > /dev/null
    endscript
}
"


curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -;
sudo --silent apt-get install --yes git build-essential python2.7;
sudo apt-get install --yes nodejs;

# Clone and setup the application
cd /opt;
rm -rf kval;
sudo git clone https://bitbucket.org/ruffrey/kval.git kval --depth 1;
cd kval;
sudo npm i --production;

# Setup init scripts
sudo rm -f $CONF_FILE
sudo cp -f install-scripts/kval.conf $CONF_DIR;
sudo chmod +x $CONF_FILE;

# Setup log rotation
mkdir -p $LOG_DIR
touch $LOG_FILE
sudo rm -f $LOGROTATE_FILE
echo "$LOGROTATE_CONFIG" | sudo tee --append "$LOGROTATE_FILE"

# Ensure proper syntax and load the conf
init-checkconf -d /etc/init/kval.conf
sudo service kval start

echo \nSuccess - installed at /opt/kval
echo Edit configuration at $CONF_FILE, then run \'sudo service kval restart\'
echo Check startup logs at /var/log/upstart/kval.log
echo Check kval dbms server logs at $LOG_FILE
