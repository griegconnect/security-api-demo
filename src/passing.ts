import { DateTime } from 'luxon'
import { Configuration, PassingsApi } from './client'
import { v4 as uuidv4 } from 'uuid';
import config from '../config'

const main = async () => {
  const apiConfig = {
    accessToken: config.token,
  } as Configuration
  const apis = {
    passingsApi: new PassingsApi(apiConfig, config.apiPath),
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
