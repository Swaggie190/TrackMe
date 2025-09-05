FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci 

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

RUN adduser -D -s /bin/sh nginxuser
RUN chown -R nginxuser:nginxuser /usr/share/nginx/html
RUN chown -R nginxuser:nginxuser /var/cache/nginx
RUN chown -R nginxuser:nginxuser /var/log/nginx
RUN chown -R nginxuser:nginxuser /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginxuser:nginxuser /var/run/nginx.pid

USER nginxuser

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]