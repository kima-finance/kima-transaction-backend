FROM node:20

ARG NPM_ACCESS_TOKEN
ENV NPM_ACCESS_TOKEN=$NPM_ACCESS_TOKEN
RUN echo //registry.npmjs.org/:_authToken=$NPM_ACCESS_TOKEN >> ~/.npmrc

RUN mkdir -p /usr/src/app
ADD . /usr/src/app/
WORKDIR /usr/src/app
RUN npm install
RUN rm -f .npmrc
CMD npm run dev
