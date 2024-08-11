# STRATUS CLI

CLI for Stratus.

## Install

```sh
npm install -g stratus-cli
```

> ***Note:*** Might need to run as root.

## Usage

1. Create an account with Stratus

2. Generate a subdomain token

3. Run

```sh
npx stratus-cli
```

## Build

1. Run `esbuild` to bundle the code

```sh
npx esbuild src/main.js --bundle --outfile=build.cjs --format=cjs --platform=node
```

2. Package the project

```sh
npx pkg build.cjs
```

3. You can also specify the target platform:

```sh
npx pkg -t node18-win-x64 build.cjs
```
