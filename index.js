import { mkdirSync } from 'fs'
import puppeteer from 'puppeteer'

const URL = process.env.URL || 'https://dweb1.infra.holochain.org'

// user screen registration key and submit button
const S_USR_KEY = '#regkey'
const S_USR_SUB = '#submit'

// password entry fields
const S_PW_1 = '#pass1'
const S_PW_2 = '#pass2'
const S_PW_SUB = '#submit'

// profile entry fields
const S_PROF_NICK = 'create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]'
const S_PROF_LOC = 'create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]'
const S_PROF_BIO = 'create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]'
const S_PROF_SUB = 'create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]'

// nav items
const S_NAV_SNS = '#nav-sessions'
const S_NAV_DSC = '#nav-discover'
const S_NAV_ACT = 'sl-tab[panel="activity"]'
const S_NAV_SN_CREATE = '#create-button'
const S_NAV_BACK = 'div.session-details div.controls sl-button'

// session related selectors
const S_SN_TITLE = 'sl-dialog[label="Create Session"]:nth-of-type(1) #title-textfield > sl-input >>> input'
const S_SN_DESC = 'sl-dialog[label="Create Session"]:nth-of-type(1) #description-textarea > sl-textarea >>> textarea'
const S_SN_CREATE = 'sl-dialog[label="Create Session"]:nth-of-type(1) #create-session-button > sl-button >>> button'
const S_SN_SEARCH = (name) => `div.session div.title ::-p-text(${name})`

// session note related selectors
const S_NOTE_DESC = 'div#note-textarea sl-textarea >>> textarea'
const S_NOTE_UPLOAD = 'upload-files >>> button'
const S_NOTE_CREATE = '#create-note-button sl-button >>> button'
const S_NOTE_SEARCH = (desc) => `div.discover-section.feed div.post-content ::-p-text(${desc})`

function randStr() {
  return 'test-' +
    Math.random().toString(36).substr(2) +
    '-' +
    Math.random().toString(36).substr(2)
}

class EmergenceStress {
  #name = null
  #browser = null
  #page = null
  #curSessionName = null

  constructor (name, browser, page) {
    try {
      mkdirSync(name)
    } catch (e) {
      /* pass */
    }

    this.#name = name
    this.#browser = browser
    this.#page = page
  }

  static async withRandom (lastChar) {
    const name = randStr()+lastChar
    return await EmergenceStress.withName(name)
  }

  static async withName (name) {
    console.log(`loading fresh page`)

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'chromium'
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 512, height: 1024 })
    await page.goto(URL)

    await page.waitForSelector(S_USR_KEY)
    await page.waitForSelector(S_USR_SUB)

    const es = new EmergenceStress(name, browser, page)

    await es.screenshot('initial-load.png')

    return es
  }

  async close() {
    await this.#browser.close()
  }

  async screenshot(filename) {
    await this.#page.screenshot({
      fullPage: true,
      path: `./${this.#name}/${filename}`
    })
  }

  async wait(selector) {
    await this.#page.waitForSelector(selector, {
      timeout: 60000,
    })
  }

  async sleep(seconds) {
    await this.#page.waitForTimeout(seconds * 1000)
  }

  async createAccount() {
    console.log(`login with user ${this.#name}`)

    await this.#page.type(S_USR_KEY, this.#name)

    await this.screenshot('enter-username.png')

    await this.#page.click(S_USR_SUB)

    await this.wait(S_PW_1)
    await this.wait(S_PW_2)
    await this.wait(S_PW_SUB)
  }

  async setPassword() {
    console.log(`set password`)

    await this.#page.type(S_PW_1, this.#name)
    await this.#page.type(S_PW_2, this.#name)

    await this.screenshot('enter-password.png')

    await this.#page.click(S_PW_SUB)

    await this.wait(S_PROF_NICK)
    await this.wait(S_PROF_LOC)
    await this.wait(S_PROF_BIO)
    await this.wait(S_PROF_SUB)
  }

  async createProfile() {
    console.log(`create profile`)

    await this.#page.type(S_PROF_NICK, this.#name)
    await this.#page.type(S_PROF_LOC, this.#name)
    await this.#page.type(S_PROF_BIO, this.#name)

    await this.screenshot('enter-profile.png')

    await this.#page.click(S_PROF_SUB)

    await this.wait(S_NAV_SNS)
  }

  async navToSessions() {
    await this.wait(S_NAV_SNS)
    await this.#page.click(S_NAV_SNS)
    await this.wait(S_NAV_SN_CREATE)
  }

  async createSession(sessionName) {
    console.log(`create session with name ${sessionName}`)
    this.#curSessionName = sessionName

    await this.navToSessions()

    await this.#page.click(S_NAV_SN_CREATE)

    await this.wait(S_SN_TITLE)
    await this.wait(S_SN_DESC)
    await this.wait(S_SN_CREATE)

    await this.#page.type(S_SN_TITLE, sessionName)
    await this.#page.type(S_SN_DESC, sessionName)

    await this.screenshot('create-session.png')

    await this.#page.click(S_SN_CREATE)

    // give it time to submit the form
    await this.#page.waitForTimeout(5000)

    await this.#page.reload()

    await this.wait(S_SN_SEARCH(sessionName))
  }

  async navToActivity() {
    // click Discover
    await this.wait(S_NAV_DSC)
    await this.#page.click(S_NAV_DSC)

    // click Activity
    await this.wait(S_NAV_ACT)
    await this.#page.click(S_NAV_ACT)
  }

  async addNote(noteDesc) {
    console.log(`add a note with description ${noteDesc}`)

    await this.navToSessions()

    await this.wait(S_SN_SEARCH(this.#curSessionName))

    await this.#page.click(S_SN_SEARCH(this.#curSessionName))

    await this.wait(S_NOTE_DESC)

    await this.#page.type(S_NOTE_DESC, noteDesc)

    console.log('uploading image to note')

    const [fileChooser] = await Promise.all([
      this.#page.waitForFileChooser(),
      this.#page.click(S_NOTE_UPLOAD),
    ])
    await fileChooser.accept(['./img/holo.png'])

    /// wait for image to upload
    await this.#page.waitForTimeout(20000)

    await this.screenshot(`create-note-${noteDesc}.png`)

    console.log('clicking create-note-button')

    await this.#page.click(S_NOTE_CREATE)

    /// wait for the note to be added
    await this.#page.waitForTimeout(5000)

    // click the back button (sometimes we need to click it multiple times : (
    for (var i = 0; i < 3; ++i) {
      try {
        await this.#page.click(S_NAV_BACK)
      } catch (e) {
        /* pass */
      }
      await this.#page.waitForTimeout(1000)
    }

    console.log('moving to Discover->Activity')

    await this.navToActivity()

    // await this.wait(S_NOTE_SEARCH(noteDesc))

    // await this.screenshot(`view-note-${noteDesc}.png`)
  }
}

const es = await EmergenceStress.withRandom(process.env.LAST_CHAR || "")

try {
  await es.createAccount()

  await es.setPassword()

  await es.createProfile()

  await es.createSession(randStr())

  while (true) {
    let sleep = (2 + (Math.random() * 18)) | 0

    if (Math.random() > .75) {
      // sometimes sleep for longer
      sleep = (20 + (Math.random() * 100)) | 0
    }

    console.log(`sleeping for ${sleep} seconds`)

    await es.sleep(sleep)

    await es.addNote(randStr())
  }
} catch (e) {
  try {
    await es.screenshot('error.png')
  } catch (e) {
    /* pass */
  }
  try {
    es.close()
  } catch (e) {
    /* pass */
  }
  throw e
}
