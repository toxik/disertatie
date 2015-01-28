#!/bin/bash
#myip=$(docker inspect -f '{{.NetworkSettings.IPAddress}}' $1)
#docker exec -ti redis redis-cli lrem frontend:docker -1 "http://$myip:3000"
#sed "s/server $myip:3000;//g" ../nginx/conf.d/_io-nodes.conf | sed /^$/d > tmp && mv tmp ../nginx/conf.d/_io-nodes.conf
#docker exec -it proxy nginx -s reload
if [ -z $1  ]
then
containers="$(docker ps -a | grep "node " | awk '{print $1}')"
else
containers=$1
fi
echo "$containers" | while read x; do docker rm -f $x; done
./updatelist.sh
