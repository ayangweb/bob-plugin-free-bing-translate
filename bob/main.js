var config = require("./config");

function supportLanguages() {
	return config.languages;
}

async function translate(query, completion) {
	try {
		const { text, detectFrom: fromLang, detectTo: to } = query;

		const { data } = await $http.get({
			url: "https://cn.bing.com/translator",
		});

		const [, IG] = data.match(/IG:"([A-Za-z0-9]+)"/);
		const [, IID] = data.match(/data-iid="(.+?)"/);
		const [, key, token] = data.match(
			/var params_AbusePreventionHelper\s*=\s*\[([0-9]+),\s*"([^"]+)",[^\]]*\];/
		);

		const result = await $http.post({
			url: `https://cn.bing.com/ttranslatev3`,
			body: {
				isVertical: 1,
				IG,
				IID,
				text,
				fromLang,
				to,
				token,
				key,
			},
			timeout: 1000 * 60,
		});

		if (!result?.data) {
			throw new Error();
		}

		const translateResult = result.data;

		const resultText = translateResult[0]?.translations[0]?.text;

		if (!resultText) throw new Error();

		completion({
			result: {
				from: fromLang,
				to,
				toParagraphs: resultText.split("\n"),
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
