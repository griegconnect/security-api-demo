import { DateTime } from 'luxon'
import {
  ApplicationApi,
  Configuration,
  IdentityApi,
  NewVisitorApplicationRequest,
  PermitsApi,
  PortApi,
} from './client'
import prompts from 'prompts'
import fs from 'fs'
import { PhoneNumberUtil } from 'google-libphonenumber'
import config from "../config"
import { ClientCredentials } from 'simple-oauth2';

const IMAGE = './portrait.jpeg'

const phoneUtil = PhoneNumberUtil.getInstance()

const validatePhone = (mobile: string) => {
  try {
    return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(mobile))
  } catch (e) {
    return false
  }
}

const main = async () => {
  const client = new ClientCredentials(config.oauth);

  const credentials = await client.getToken({
    audience: config.oauthAudience
  })

  const apiConfig = {
    accessToken: credentials.token.access_token,
  } as Configuration

  const apis = {
    portApi: new PortApi(apiConfig, config.apiPath),
    identityApi: new IdentityApi(apiConfig, config.apiPath),
    permitsApi: new PermitsApi(apiConfig, config.apiPath),
    applicationsApi: new ApplicationApi(apiConfig, config.apiPath),
  }

  try {
    //Get port details
    const portDetails = await apis.portApi.getPortDetails(config.tenant)

    // //Enter mobile number in CLI
    const mobile = await prompts({
        type: 'text',
        name: 'mobile',
        message: 'Enter mobile number:',
        validate: value => validatePhone(value) ? true : 'Invalid phone number'
    }).then(r => r.mobile)

    await apis.identityApi.issueMobileLoginRequest(config.tenant, {mobile})

    // //Enter PIN code from SMS in CLI
    const code = await prompts({
        type: 'number',
        name: 'pin',
        message: 'Enter PIN code from SMS:'
    }).then(r => r.pin)

    await apis.identityApi.verifyMobile(config.tenant, {code, mobile})
    .catch(e => {throw new Error('Failed to verify mobile number')})

    //Upload image
    const data = fs.readFileSync(IMAGE)
    const file = new File([data], 'portrait.jpeg', { type: 'image/jpeg' })

    const fileDetails = await apis.portApi.uploadFile(config.tenant, 'portrait', file)

    //Set arrival time
    const timeIn = DateTime.now().toISO()
    // Pick purpose
    const purpose = portDetails.data.purposes && portDetails.data.purposes[0].id
    // Pick target
    const target = portDetails.data.port_companies && portDetails.data.port_companies[0]
    // Pick facility
    const facility = portDetails.data.areas && portDetails.data.areas[0].id

    //Get max duration
    const maxDuration = await apis.permitsApi.getMaxDuration(config.tenant, timeIn, target?.company?.id, purpose, facility)

    if (!maxDuration) throw new Error('Failed to get max duration')
    if (!purpose) throw new Error('Failed to get purpose')
    if (!target) throw new Error('Failed to get target')
    if (!facility) throw new Error('Failed to get facility')

    //Create application
    const application = await apis.applicationsApi.createApplication(config.tenant, {
      visitor: {
        company: 'Test Company',
        data:{
          mobile: "mobile",
          files: [fileDetails.data.id],
        }
      },
      visiting: {
        facility,
        purpose,
        timeIn,
        timeOut: DateTime.now().plus({ hours: 2 }).toISO(),
        target: {
          type: 'company',
          value: {
            id: target.company ? target.company.id : '',
          },
        },
        visitHandler: undefined,
      },
      message: 'This is a test application',
      securityConfirmations: portDetails.data.securityConfirmations?.map((i) => i.id) || [],
    } as NewVisitorApplicationRequest)

    //Get application status
    if (application.data.id) {
      const status = await apis.applicationsApi.getApplicationStatus(config.tenant, application.data.id)
      console.log('Last status was ', status.data.status)
    } else {
      console.error('Failed to create application')
    }
  } catch (e) {
    console.error(e)
  }
}

main().catch((err) => console.error(err))
