#!/bin/bash
set -e

docker exec aiida-database pg_dumpall -U pguser --globals-only > backup/aiida_db.dump.globals 
docker exec aiida-database pg_dump -U aiida -w -d aiida_db -F t > backup/aiida_db.dump.tar
mkdir -p backup
docker run -v tests_aiida-object-store:/volume -v "${PWD}/backup:/backup" --rm loomchild/volume-backup backup aiida_archive
