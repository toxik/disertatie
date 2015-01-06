docker run -it -d --name node-$1 -p $1:$1 -v "$(pwd)":/usr/src/myapp -e "'PORT=$1'" -w /usr/src/myapp node npm start
if [ $? -ne 0 ];then docker start node-$1; fi
if [ $? -ne 0 ];then echo "Sorry, can't start"; fi
