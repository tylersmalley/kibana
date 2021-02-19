FROM node:14.15.4-buster as base

### Install packages required by Bazel and its tests
RUN dpkg --add-architecture i386 && \
  apt-get -y update && \
  apt-get -y install --no-install-recommends \
  curl \
  git \
  python3 \
  unzip \
  wget \
  && \
  apt-get -qqy purge apport && \
  rm -rf /var/lib/apt/lists/*

# RUN curl -Lo /usr/local/bin/bazel https://github.com/bazelbuild/bazelisk/releases/download/v1.7.3/bazelisk-linux-amd64 && \
#     chown root:root /usr/local/bin/bazel && \
#     chmod 0755 /usr/local/bin/bazel

# RUN curl -Lo /usr/local/bin/bazel https://github.com/bazelbuild/bazel/releases/download/4.0.0/bazel-4.0.0-linux-x86_64 && \
#     chown root:root /usr/local/bin/bazel && \
#     chmod 0755 /usr/local/bin/bazel
