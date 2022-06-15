FROM node:16.13
ENV NODE_ENV=production
WORKDIR /usr/src/bot
COPY ["package.json", "./"]
RUN npm install
COPY . .
EXPOSE 3000
RUN chown -R node /usr/src/bot
USER node
CMD ["npm", "start"]
