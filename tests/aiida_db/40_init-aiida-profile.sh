#!/bin/bash
set -e

# only unzip the first time, if we restart the container
if [[ ! -f /opt/UNZIP_COMPLETED ]] ; then
    tar -xjf /etc/my_init.d/aiida_archive.tar.bz2 -C /home/aiida/.aiida
    touch /opt/UNZIP_COMPLETED
fi
