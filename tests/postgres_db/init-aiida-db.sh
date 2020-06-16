#!/bin/bash
set -e

# backup created using: docker exec aiida-database pg_dump -U aiida -w -d aiida_db -F t > aiida_db.dump.tar
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE aiida;
    ALTER ROLE aiida WITH NOSUPERUSER INHERIT NOCREATEROLE CREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'md54456c1e25617bf54c4c993d4c4430a72';
EOSQL
createdb -U aiida -T template0 aiida_db
pg_restore --user=aiida --dbname=aiida_db --format=t docker-entrypoint-initdb.d/aiida_db.dump.tar
