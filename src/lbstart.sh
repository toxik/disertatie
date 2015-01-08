#docker run -it -d --name node-$1 -p $1:$1 -v "$(pwd)":/usr/src/myapp -e "'PORT=$1'" -w /usr/src/myapp node:slim npm start
container=$(docker run -it -d --expose 3000 -P -v "$(pwd)":/usr/src/myapp --link redis:redis -w /usr/src/myapp node:slim npm start)
echo $(docker inspect -f '{{.Name}}' $container)
new_port=$(docker port $container | grep '3000/tcp' | awk -F: '{print $2}')
#new_host=$(docker inspect -f '{{.NetworkSettings.IPAddress}}' $container)
new_host=docker
docker exec -ti proxy redis-cli rpush frontend:docker "http://$new_host:$new_port"
if [ $? -ne 0 ];then echo "Sorry, can't start"; fi
echo $newhost
