## API

### Requirements
- Nodejs LTS version >= 8.1.14
- MongoDB

### Installation
1. Clone the repository and checkout the correct branch
```
git clone https://github.com/status-im/dreddit-dapp.git
cd dreddit-dapp
git checkout ethberlin
npm install
```
2. If you want to change the DB server connection string or accounts that can upload tshirts, edit `./api/config.js`

3. Build the service with `npm run-script build`

4. Start the service by running `npm run-script serve`

> If you're a developer, you might want to execute `npm start` instead of the previous instruction. This will reload the server when you make changes, but it's not recommended for production usage

## DAPP
### Requirements
- Embark (latest version is recommended)
- IPFS

### Installation
1. Clone the repository and checkout the correct branch
```
git clone https://github.com/status-im/dreddit-dapp.git
cd dreddit-dapp
git checkout ethberlin
npm install
```
2. Edit `./app/js/config.js` to set the URL of the restful service

3. `embark run`

### Uploading
At the moment it needs to be done manually to avoid having large files. Embark 2.0 will provide options to compress the size of javascript files via webpack configuration. 


1. Start `embark blockchain testnet` and `ipfs daemon` in a different terminal session

```
embark build testnet
npm run-script uglify
npm run-script upload
```
Using the hash returned by ipfs, edit `./api/config.js` to set the DApp URL.
Access the URL in a browser and then pin it to infura.
```
curl "https://ipfs.infura.io:5001/api/v0/pin/add?arg=YOUR_IPFS_FOLDER_HASH_HERE&recursive=true"
```
You can also access the public list of gateways in https://ipfs.github.io/public-gateway-checker/ , browse the same hash on all the online gateways, to guarantee having more nodes in the network containing your files. (This could be automated with wget)