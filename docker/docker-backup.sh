#!/bin/bash
set -e

mkdir -p backup
rm -f backup/*
echo "dumping DB globals"
docker exec aiida-database pg_dumpall -U pguser --globals-only > backup/aiida_db.dump.globals 
echo "dumping DB"
docker exec aiida-database pg_dump -U aiida -w -d aiida_db -F t > backup/aiida_db.dump.tar
echo "dumping object store"
docker run -v docker_aiida-object-store:/volume -v "${PWD}/backup:/backup" --rm loomchild/volume-backup backup aiida_archive
