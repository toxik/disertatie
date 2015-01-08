docker run -d --name proxy -v `pwd`/certs:/certs --link redis:redis -v `pwd`/config.json:/usr/local/lib/node_modules/hipache/config/config.json -p 80:80 -p 443:443 toxik/hipache
