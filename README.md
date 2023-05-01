# Package Cutter

This tool can remove some properties from `package.json`.  
Some of the properties you have in `package.json` are only required for development (like `scripts`, `devDependencies`, `targets` if you use [Parcel](https://parceljs.org/)), can grow pretty large and shouldn't actually be present in published package.  
So, if your build process is advanced enough, you probably should throw them away when preparing your release.  

## Install

```bash
npm install @nartallax/package-cutter
```

## Use

```bash
# this will take ./package.json
# then remove default set of keys from it
# then put result in ./build_result/package.json
./node_modules/.bin/package-cutter --output ./build_result/package.json

# There are other CLI parameters like `--pretty` or `--keys`
# find out more by running
./node_modules/.bin/package-cutter --help
```
