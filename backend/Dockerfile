# Local development only — production runs directly on EC2 via CodeDeploy
# (see infrastructure/terraform/modules/compute), not this image. This
# exists so `docker-compose up` gives the whole team an identical backend +
# Postgres environment without installing Postgres locally.
FROM node:24-slim

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
