#!/bin/bash
#docker run -it -d --name node-$1 -p $1:$1 -v "$(pwd)":/usr/src/myapp -e "'PORT=$1'" -w /usr/src/myapp node:slim npm start
container=$(docker run -it -d -e "DEBUG=socket.io*" --expose 3000 -v "$(pwd)":/usr/src/myapp --link redis:redis -w /usr/src/myapp node:slim node socket.js)
echo $(docker inspect -f '{{.Name}}' $container) #&& touch .$(docker inspect -f '{{.Name}}' $container) 
new_port=$(docker port $container | grep '3000/tcp' | awk -F: '{print $2}')
new_host=$(docker inspect -f '{{.NetworkSettings.IPAddress}}' $container)
#new_host=docker
new_port=3000
sed "s/ip_hash;/ip_hash;|server $new_host:$new_port;/g" ../nginx/conf.d/_io-nodes.conf | tr '|' '\n' > tmp && mv tmp ../nginx/conf.d/_io-nodes.conf
docker exec -it proxy nginx -s reload
if [ $? -ne 0 ];then echo "Sorry, can't start"; fi
echo $newhost
