FROM tylersmalley/kibana-ci-base:latest

WORKDIR /kibana

# Node Modules

COPY .node-version package.json yarn.lock preinstall_check.js .yarnrc ./
RUN --mount=type=cache,target=/kibana/.yarn-local-mirror yarn install

# Not ideal: We should be able to bootstrap before adding all repo
COPY . .

RUN yarn kbn bootstrap --no-cache
