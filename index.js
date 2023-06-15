import puppeteer from 'puppeteer'

function randStr() {
  return 'e-stress-' + Math.random().toString(36).substr(2)
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

    await page.screenshot({
      fullPage: true,
      path: 'page1.png'
    })

    return new EmergenceStress(name, browser, page)
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

  async createAccount() {
    console.log(`login with user ${this.#name}`)

    await this.#page.type('form input[name="key"]', this.#name)
    await this.#page.click('form input[name="submit"]')

    await this.#page.waitForSelector('form input[name="password"]')
    await this.#page.waitForSelector('form input[name="password2"]')
    await this.#page.waitForSelector('form input[name="submit"]')
  }

  async setPassword() {
    console.log(`set password`)

    await this.#page.type('form input[name="password"]', this.#name)
    await this.#page.type('form input[name="password2"]', this.#name)
    await this.#page.click('form input[name="submit"]')

    await this.#page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form')
    await this.#page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]')
    await this.#page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]')
    await this.#page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]')
    await this.#page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]')
  }

  async createProfile() {
    console.log(`create profile`)

    await this.#page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]', this.#name)
    await this.#page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]', this.#name)
    await this.#page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]', this.#name)
    await this.#page.click('create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]')

    await this.#page.waitForSelector('file-storage-context div#content div.pane div.pane-content')
    await this.#page.waitForSelector('div.nav div.nav-button[title="Sync"]')
    await this.#page.waitForSelector('#create-button')
  }

  async createSession(sessionName) {
    console.log(`create session with name ${sessionName}`)
    this.#curSessionName = sessionName

    await this.#page.click('#create-button')

    await this.#page.waitForSelector('sl-dialog[label="Create Session"]:nth-of-type(1) #title-textfield > sl-input >>> input')
    await this.#page.waitForSelector('sl-dialog[label="Create Session"]:nth-of-type(1) #description-textarea > sl-textarea >>> textarea')
    await this.#page.waitForSelector('sl-dialog[label="Create Session"]:nth-of-type(1) #create-session-button > sl-button >>> button')

    await this.#page.type('sl-dialog[label="Create Session"]:nth-of-type(1) #title-textfield > sl-input >>> input', sessionName)
    await this.#page.type('sl-dialog[label="Create Session"]:nth-of-type(1) #description-textarea > sl-textarea >>> textarea', sessionName)
    await this.#page.click('sl-dialog[label="Create Session"]:nth-of-type(1) #create-session-button > sl-button >>> button')

    // give it time to submit the form
    await this.#page.waitForTimeout(5000)

    await this.#page.reload()

    await this.#page.waitForSelector(`div.session div.title ::-p-text(${sessionName})`)
  }

  async addNote() {
    console.log(`add a note`)

    await this.#page.click(`div.session div.title ::-p-text(${this.#curSessionName})`)

    await this.#page.waitForSelector('div#note-textarea sl-textarea >>> textarea')

    await this.#page.type('div#note-textarea sl-textarea >>> textarea', this.#curSessionName)

    const [fileChooser] = await Promise.all([
      this.#page.waitForFileChooser(),
      this.#page.click('upload-files >>> button'),
    ])
    await fileChooser.accept(['./img/holo.png'])

    /// wait for image to upload
    await this.#page.waitForTimeout(5000)

    await this.#page.click('#create-note-button sl-button >>> button')

    /// wait for the note to be added
    await this.#page.waitForTimeout(5000)
  }

  async clickSync() {
    console.log('click Sync')

    await this.#page.click('div.nav div.nav-button[title="Sync"]')

    await this.#page.waitForTimeout(100)
  }
}

try {
  const es = await EmergenceStress.withRandom()
  await es.screenshot('page1.png')

  await es.createAccount()
  await es.screenshot('page2.png')

  await es.setPassword()
  await es.screenshot('page3.png')

  await es.createProfile()
  await es.screenshot('page4.png')

  await es.createSession(randStr())
  await es.screenshot('page5.png')

  await es.addNote()
  await es.screenshot('page6.png')

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
