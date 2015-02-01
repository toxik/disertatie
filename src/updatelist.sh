#!/bin/bash
PORT=3000
echo "upstream io_nodes { ip_hash;" > ../nginx/conf.d/_io-nodes.conf
docker ps | grep "node " | awk '{print $1}' | while read cont; do echo "server $(docker inspect -f '{{.NetworkSettings.IPAddress}}' $cont):$PORT;" >> ../nginx/conf.d/_io-nodes.conf ; done
echo } >> ../nginx/conf.d/_io-nodes.conf
docker exec -it proxy nginx -s reload
