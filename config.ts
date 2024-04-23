require('dotenv').config()

export default {
  tenant: 'HAU',
  apiPath: process.env['API_PATH'] || '',
  oauth: {
    client: {
      id: process.env['OAUTH_CLIENT_ID'] || '',
      secret: process.env['OAUTH_CLIENT_SECRET'] || '',
    },
    auth: {
      tokenHost: process.env['OAUTH_HOST'] || '',
    },
  },
  oauthAudience: process.env['OAUTH_AUDIENCE'] || '',
}
