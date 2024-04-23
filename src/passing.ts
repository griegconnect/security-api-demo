import { DateTime } from 'luxon'
import { Configuration, PassingsApi } from './client'
import { v4 as uuidv4 } from 'uuid';
import config from '../config'
import { ClientCredentials } from 'simple-oauth2';

const main = async () => {
  const client = new ClientCredentials(config.oauth);

  const credentials = await client.getToken({
    audience: config.oauthAudience
  })
  const apis = {
    passingsApi: new PassingsApi({
      accessToken: credentials.token.access_token,
    } as Configuration, config.apiPath),
  }

  try {
    //Get lastest passings
    const passings = await apis.passingsApi.getPassings(config.tenant)
    console.info("Fetched latest passings, got: ", passings.data.values?.length || 0)

    //Post the passing back again
    const res = await apis.passingsApi.createPassing(config.tenant, {
      timestamp: DateTime.now().toISO(),
      licensePlate: 'JD1234',
      eventId: uuidv4(),
      readerId: '203',
      image: 'https://rusticplates.com/cdn/shop/products/2022-11-2514.02.18.jpg?v=1669432484',
    })
    console.info("Passing created")
  } catch (e: any) {
    console.log(e.response.data)
  }
}

main().catch((err) => console.error(err))
