mkdir -p certs
openssl req -x509 -newkey rsa:4096 -nodes -keyout certs/redis.key -out certs/redis.crt -days 365 -subj '/CN=localhost'

sudo chmod 644 certs/redis.key
sudo chmod 644 certs/redis.crt

sudo chown 999:999 certs/redis.key
sudo chown 999:999 certs/redis.crt
sudo chown 999:999 users.acl