#myip=$(docker inspect -f '{{.NetworkSettings.IPAddress}}' $1)
#docker exec -ti redis redis-cli lrem frontend:docker -1 "http://$myip:3000"
#sed "s/server $myip:3000;//g" ../nginx/conf.d/_io-nodes.conf | sed /^$/d > tmp && mv tmp ../nginx/conf.d/_io-nodes.conf
#docker exec -it proxy nginx -s reload
docker rm -f $1
./updatelist.sh
rm -f $1
