### Requirements
To run this application, you must have **pnpm** and **Node.js** installed. More information on installation can be found at the following links:

- Node.js: [Download Node.js](https://nodejs.org/en/download)
- pnpm: [Installation Guide](https://pnpm.io/installation)

### Configuration
Before running the application, you need to create a `.env` file with the required credentials. Add the following variables to the `.env` file:

```env
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
OAUTH_HOST=...
OAUTH_AUDIENCE=g...
API_PATH=...
```


### Installation
To install the required dependencies, use the following command:
```sh
pnpm i
```

### Update Configuration
Update the configuration defined in `config.ts` with the information provided by Grieg Connect.

### Running the Application
To create a visitor application, run the following command:
```sh
pnpm run application
```
To create a passing run, use the command:
```sh
pnpm run passing
```