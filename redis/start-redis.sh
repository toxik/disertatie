chmod 777 appendonly.aof
docker run --name redis -v `pwd`:/data -d redis redis-server --appendonly yes
if [ "$?" -ne 0 ];then docker start redis; fi
