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
2. If you want to change the DB server connection string, edit `./api/main.js`

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

