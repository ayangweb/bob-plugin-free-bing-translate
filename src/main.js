var config = require("./config");

function supportLanguages() {
	return config.languages;
}

async function translate(query, completion) {
	try {
		const { text, detectFrom: fromLang, detectTo: to } = query;

		const params = await $http.get({
			url: "https://cn.bing.com/translator",
		});

		if (!params?.data) throw new Error();

		const { data } = params;

		const [, IG] = data.match(/IG:"([A-Za-z0-9]+)"/);
		const [, IID] = data.match(/data-iid="(.+?)"/);
		const [, key, token] = data.match(
			/var params_AbusePreventionHelper\s*=\s*\[([0-9]+),\s*"([^"]+)",[^\]]*\];/
		);

		const geTranslateResult = async (subdomain = "cn") => {
			const result = await $http.post({
				url: `https://${subdomain}.bing.com/ttranslatev3?isVertical=1&IG=${IG}&IID=${IID}`,
				body: {
					text,
					fromLang,
					to,
					token,
					key,
				},
				header: { "content-type": "application/x-www-form-urlencoded" },
				timeout: 1000 * 60,
			});

			return result;
		};

		let result = await geTranslateResult();

		if (!result?.data) {
			result = await geTranslateResult("www");

			if (!result?.data) throw new Error();
		}

		const { statusCode, errorMessage } = result.data;

		if (statusCode) throw new Error(errorMessage);

		completion({
			result: {
				from: fromLang,
				to,
				toParagraphs: result.data[0].translations[0].text.split("\n"),
			},
		});
	} catch ({ message }) {
		completion({
			error: {
				type: "unknown",
				message,
			},
		});
	}
}

module.exports = {
	supportLanguages,
	translate,
};
