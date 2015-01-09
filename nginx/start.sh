docker run --name proxy -v `pwd`/../certs:/etc/nginx/certs -v `pwd`/conf.d:/etc/nginx/conf.d -p 80:80 -p 443:443 -d nginx
