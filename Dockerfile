FROM postgres:16.0
LABEL Name=electricitydb Version=0.0.1
ADD init-db.tar.gz /docker-entrypoint-initdb.d/