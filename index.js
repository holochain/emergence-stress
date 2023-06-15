import puppeteer from 'puppeteer'

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
    this.#name = name
    this.#browser = browser
    this.#page = page
  }

  static async withRandom () {
    const name = randStr()
    return await EmergenceStress.withName(name)
  }

  static async withName (name) {
    console.log(`loading fresh page`)

    const browser = await puppeteer.launch({
      headless: 'new'
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 512, height: 1024 })
    await page.goto('https://dweb1.infra.holochain.org/')

    await page.waitForSelector('form input[name="key"]')
    await page.waitForSelector('form input[name="submit"]')

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
      path: filename
    })
  }

  async wait(selector) {
    await this.#page.waitForSelector(selector, {
      timeout: 300000,
    })
  }

  async createAccount() {
    console.log(`login with user ${this.#name}`)

    await this.#page.type('form input[name="key"]', this.#name)

    await this.screenshot('enter-username.png')

    await this.#page.click('form input[name="submit"]')

    await this.wait('form input[name="password"]')
    await this.wait('form input[name="password2"]')
    await this.wait('form input[name="submit"]')
  }

  async setPassword() {
    console.log(`set password`)

    await this.#page.type('form input[name="password"]', this.#name)
    await this.#page.type('form input[name="password2"]', this.#name)

    await this.screenshot('enter-password.png')

    await this.#page.click('form input[name="submit"]')

    await this.wait('create-profile >>> edit-profile >>> form#profile-form')
    await this.wait('create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]')
    await this.wait('create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]')
    await this.wait('create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]')
    await this.wait('create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]')
  }

  async createProfile() {
    console.log(`create profile`)

    await this.#page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]', this.#name)
    await this.#page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]', this.#name)
    await this.#page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]', this.#name)

    await this.screenshot('enter-profile.png')

    await this.#page.click('create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]')

    await this.wait('file-storage-context div#content div.pane div.pane-content')
    await this.wait('div.nav div.nav-button[title="Sync"]')
    await this.wait('#create-button')
  }

  async navToSessions() {
    await this.wait('#nav-sessions')
    await this.#page.click('#nav-sessions')
    await this.wait('#create-button')
  }

  async createSession(sessionName) {
    console.log(`create session with name ${sessionName}`)
    this.#curSessionName = sessionName

    await this.navToSessions()

    await this.#page.click('#create-button')

    await this.wait('sl-dialog[label="Create Session"]:nth-of-type(1) #title-textfield > sl-input >>> input')
    await this.wait('sl-dialog[label="Create Session"]:nth-of-type(1) #description-textarea > sl-textarea >>> textarea')
    await this.wait('sl-dialog[label="Create Session"]:nth-of-type(1) #create-session-button > sl-button >>> button')

    await this.#page.type('sl-dialog[label="Create Session"]:nth-of-type(1) #title-textfield > sl-input >>> input', sessionName)
    await this.#page.type('sl-dialog[label="Create Session"]:nth-of-type(1) #description-textarea > sl-textarea >>> textarea', sessionName)

    await this.screenshot('create-session.png')

    await this.#page.click('sl-dialog[label="Create Session"]:nth-of-type(1) #create-session-button > sl-button >>> button')

    // give it time to submit the form
    await this.#page.waitForTimeout(5000)

    await this.#page.reload()

    await this.wait(`div.session div.title ::-p-text(${sessionName})`)
  }

  async navToActivity() {
    // click Discover
    await this.wait('#nav-discover')
    await this.#page.click('#nav-discover')

    // click Activity
    await this.wait('sl-tab[panel="activity"]')
    await this.#page.click('sl-tab[panel="activity"]')
  }

  async addNote(noteDesc) {
    console.log(`add a note with description ${noteDesc}`)

    await this.navToSessions()

    await this.wait(`div.session div.title ::-p-text(${this.#curSessionName})`)

    await this.#page.click(`div.session div.title ::-p-text(${this.#curSessionName})`)

    await this.wait('div#note-textarea sl-textarea >>> textarea')

    await this.#page.type('div#note-textarea sl-textarea >>> textarea', noteDesc)

    console.log('uploading image to note')

    const [fileChooser] = await Promise.all([
      this.#page.waitForFileChooser(),
      this.#page.click('upload-files >>> button'),
    ])
    await fileChooser.accept(['./img/holo.png'])

    /// wait for image to upload
    await this.#page.waitForTimeout(20000)

    await this.screenshot(`create-note-${noteDesc}.png`)

    console.log('clicking create-note-button')

    await this.#page.click('#create-note-button sl-button >>> button')

    /// wait for the note to be added
    await this.#page.waitForTimeout(5000)

    // click the back button (sometimes we need to click it multiple times : (
    for (var i = 0; i < 3; ++i) {
      try {
        await this.#page.click('div.session-details div.controls sl-button')
      } catch (e) {
        /* pass */
      }
      await this.#page.waitForTimeout(1000)
    }

    console.log('moving to Discover->Activity')

    await this.navToActivity()

    await this.wait(`div.discover-section.feed div.post-content ::-p-text(${noteDesc})`)

    await this.screenshot(`view-note-${noteDesc}.png`)
  }
}

const es = await EmergenceStress.withRandom()

try {
  await es.createAccount()

  await es.setPassword()

  await es.createProfile()

  await es.createSession(randStr())

  await es.addNote(randStr())

  await es.close()
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
