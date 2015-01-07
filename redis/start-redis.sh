docker run --name redis -v `pwd`:/data -p 6379:6379 -d redis redis-server --appendonly yes
if [ "$?" -ne 0 ];then docker start redis; fi
