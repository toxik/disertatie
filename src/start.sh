#docker run -it -d --name node-$1 -p $1:$1 -v "$(pwd)":/usr/src/myapp -e "'PORT=$1'" -w /usr/src/myapp node:slim npm start
docker run -it -d --name node-$1 -p $1:$1 -v "$(pwd)":/usr/src/myapp -e "PORT=$1" --link redis:redis -w /usr/src/myapp node:slim npm start
if [ $? -ne 0 ];then docker start node-$1; fi
if [ $? -ne 0 ];then echo "Sorry, can't start"; fi
