#!/bin/bash
set -e

# only unzip the first time, if we restart the container
if [[ ! -f /opt/UNZIP_COMPLETED ]] ; then
    tar -xjf /etc/my_init.d/aiida_archive.tar.bz2 -C /home/aiida/.aiida
    touch /opt/UNZIP_COMPLETED
fi

# change rabbitmq to host on docker network
# TODO replace when https://github.com/aiidateam/aiida-core/pull/4118 merged
file_path="${AIIDA_PKG:-"/opt/venv/lib/python3.6/site-packages/aiida"}/manage/external/rmq.py"
if [[ -f ${file_path} ]]; then
    sed -i "s/amqp:\/\/127.0.0.1/amqp:\/\/${RMQHOST:-messaging}/g" "${file_path}"
fi

# TODO option to start verdi daemon, waiting first (with timeout) for verdi status to be green
# also env variable of how many workers to start,
# and whether the container should fail on startup if the daemon cannot be started