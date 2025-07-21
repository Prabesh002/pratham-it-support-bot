FROM node:20-alpine AS base
WORKDIR /app


FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm install --production

FROM base AS build
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build:prod

FROM base AS production
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/register-paths.js ./
COPY --from=build /app/package.json ./
COPY --from=build /app/tsconfig.json ./

EXPOSE 8080
CMD ["npm", "run", "prod"]