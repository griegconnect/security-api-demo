import { DateTime } from 'luxon'
import { Configuration, PassingsApi } from './client'
import { v4 as uuidv4 } from 'uuid';

const TOKEN = ''
const TENANT = 'SVG'
const BASE_PATH = 'https://security.test.grieg.io/api'

const main = async () => {
  const config = {
    accessToken: TOKEN,
  } as Configuration
  const apis = {
    passingsApi: new PassingsApi(config, BASE_PATH),
  }

  try {
    //Get lastest passings
    const passings = await apis.passingsApi.getPassings(TENANT)
    console.info("Fetched latest passings, got: ", passings.data.values?.length || 0)

    //Post the passing back again
    const res = await apis.passingsApi.createPassing(TENANT, {
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
