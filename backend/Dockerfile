FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "run", "dev"]