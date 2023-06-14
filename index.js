import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  headless: 'new'
})

const runRand = 'a' + Math.random().toString(36).substr(2) + 'a'

console.log(`creating new account "${runRand}"`)

const page = await browser.newPage()
await page.setViewport({ width: 512, height: 1024 })
await page.goto('https://dweb1.infra.holochain.org/')

await page.waitForSelector('form input[name="key"]')
await page.waitForSelector('form input[name="submit"]')

await page.screenshot({
  fullPage: true,
  path: 'page1.png'
})

console.log('setting password')

await page.type('form input[name="key"]', runRand)
await page.click('form input[name="submit"]')

await page.waitForSelector('form input[name="password"]')
await page.waitForSelector('form input[name="password2"]')
await page.waitForSelector('form input[name="submit"]')

await page.screenshot({
  fullPage: true,
  path: 'page2.png'
})

await page.type('form input[name="password"]', runRand)
await page.type('form input[name="password2"]', runRand)
await page.click('form input[name="submit"]')

await page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form')
await page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]')
await page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]')
await page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]')
await page.waitForSelector('create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]')

await page.screenshot({
  fullPage: true,
  path: 'page3.png'
})

console.log('creating profile')

await page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="nickname"] >>> input[name="nickname"]', runRand)
await page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="location"] >>> input[name="location"]', runRand)
await page.type('create-profile >>> edit-profile >>> form#profile-form sl-input[name="bio"] >>> input[name="bio"]', runRand)
await page.click('create-profile >>> edit-profile >>> form#profile-form sl-button[type="submit"] >>> button[type="submit"]')

await page.waitForSelector('file-storage-context div#content div.pane div.pane-content')
await page.waitForSelector('div.nav div.nav-button[title="Sync"]')

await page.screenshot({
  fullPage: true,
  path: 'page4.png'
})

console.log('click Sync')

await page.click('div.nav div.nav-button[title="Sync"]')

await page.waitForTimeout(100)

await page.screenshot({
  fullPage: true,
  path: 'page5.png'
})

await browser.close()
