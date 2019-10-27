# Dockerfile
FROM node:10
# Or whatever Node version/image you want
WORKDIR '/var/www/app'
# install app dependencies
COPY package*.json ./
RUN npm install
# copy the app into the container
COPY . .
# expose our web port
EXPOSE 7766
# run the server
CMD ["node", "bin/stampede-server.js"]