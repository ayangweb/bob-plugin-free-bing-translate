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

		const result = await $http.post({
			url: `https://cn.bing.com/ttranslatev3?isVertical=1&IG=${IG}&IID=${IID}`,
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

		if (!result?.data) {
			throw new Error();
		}

		const translateResult = result.data;

		if (translateResult?.statusCode) throw new Error();

		completion({
			result: {
				from: fromLang,
				to,
				toParagraphs:
					translateResult[0].translations[0].text.split("\n"),
			},
		});
	} catch (error) {
		completion({
			error: {
				type: "unknown",
				message: "未知错误",
				addtion: "如果多次请求失败，请联系插件作者！",
			},
		});
	}
}

module.exports = {
	supportLanguages,
	translate,
};
