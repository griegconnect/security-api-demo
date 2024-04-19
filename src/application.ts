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

const TOKEN = ''
const TENANT = 'SVG'
const BASE_PATH = 'https://security.test.grieg.io/api'
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
  const config = {
    accessToken: TOKEN,
  } as Configuration
  const apis = {
    portApi: new PortApi(config, BASE_PATH),
    identityApi: new IdentityApi(config, BASE_PATH),
    permitsApi: new PermitsApi(config, BASE_PATH),
    applicationsApi: new ApplicationApi(config, BASE_PATH),
  }

  try {
    //Get port details
    const portDetails = await apis.portApi.getPortDetails(TENANT)

    //Enter mobile number in CLI
    const mobileNumber = await prompts({
        type: 'text',
        name: 'mobile',
        message: 'Enter mobile number:',
        validate: value => validatePhone(value) ? true : 'Invalid phone number'
    }).then(r => r.mobile)

    // await apis.identityApi.issueMobileLoginRequest(TENANT, {mobile: "+4791124647"})

    //Enter PIN code from SMS in CLI
    const pincode = await prompts({
        type: 'number',
        name: 'pin',
        message: 'Enter PIN code from SMS:'
    }).then(r => r.pin)

    await apis.identityApi.verifyMobile(TENANT, {pin: pincode})
    .catch(e => {throw new Error('Failed to verify mobile number')})

    //Upload image
    const data = fs.readFileSync(IMAGE)
    const file = new File([data], 'portrait.jpeg', { type: 'image/jpeg' })

    const fileDetails = await apis.portApi.uploadFile(TENANT, 'portrait', file)

    //Set arrival time
    const timeIn = DateTime.now().toISO()
    // Pick purpose
    const purpose = portDetails.data.purpose && portDetails.data.purpose[0].id
    // Pick target
    const target = portDetails.data.port_companies && portDetails.data.port_companies[0]
    // Pick facility
    const facility = portDetails.data.areas && portDetails.data.areas[0].id

    //Get max duration
    const maxDuration = await apis.permitsApi.getMaxDuration(TENANT, timeIn, target?.company?.id, purpose, facility)

    if (!maxDuration) throw new Error('Failed to get max duration')
    if (!purpose) throw new Error('Failed to get purpose')
    if (!target) throw new Error('Failed to get target')
    if (!facility) throw new Error('Failed to get facility')

    //Create application
    const application = await apis.applicationsApi.createApplication(TENANT, {
      visitor: {
        company: 'Test Company',
        data:{
          mobile: mobileNumber,
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
      const status = await apis.applicationsApi.getApplicationStatus(TENANT, application.data.id)
      console.log('Last status was ', status.data.status)
    } else {
      console.error('Failed to create application')
    }
  } catch (e) {
    console.error(e)
  }
}

main().catch((err) => console.error(err))
