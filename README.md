# STRATUS CLI

CLI for Stratus.

## Install

1. Download the latest release

2. Modify execution rules
```sh
chmod +x <stratus-cli>
```

3. Run

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
