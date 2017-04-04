#FROM ubuntu:14.04
FROM nodesource/precise:6.2.0

ADD package.json package.json

RUN npm install

ADD . .

CMD ["node", "./bin/www"]

# Install dependencies
#RUN apt-get 
