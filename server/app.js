// 引入 koa 框架
const Koa = require("koa2");

// 引入处理 post 数据的插件
const bodyParser = require("koa-bodyparser");

// 引入 koa 路由
const KoaRouter = require("koa-router");

// 引入 axios
const axios = require("axios");

// 创建服务器实例
const app = new Koa();

// 创建路由实例
const router = new KoaRouter();

// 使用bodyParser
app.use(bodyParser());

// 使用路由
app.use(router.routes(), router.allowedMethods());

// 监听端口
app.listen("5678", () => {
	console.log("端口号为 5678 的服务器已经启动！");
});

// 翻译 api
router.post("/translate", async (ctx) => {
	// body 传 text(所译文本) 和 to(目标语言)
	const { body } = ctx.request;

	const { data } = await axios.get("https://cn.bing.com/translator");

	const [, IG] = data.match(/IG:"([A-Za-z0-9]+)"/);
	const [, IID] = data.match(/data-iid="(.+?)"/);
	const [, key, token] = data.match(
		/var params_AbusePreventionHelper\s*=\s*\[([0-9]+),\s*"([^"]+)",[^\]]*\];/
	);

	let bodyParams = {
		...body,
		fromLang: "auto-detect",
		token,
		key,
	};

	const { data: translateResult } = await axios.post(
		"https://cn.bing.com/ttranslatev3",
		bodyParams,
		{
			params: {
				isVertical: 1,
				IG,
				IID,
			},
			headers: { "content-type": "application/x-www-form-urlencoded" },
		}
	);

	const { statusCode, errorMessage } = translateResult;

	if (statusCode) {
		ctx.body = errorMessage;

		return;
	}

	ctx.body = translateResult[0].translations[0].text.split("\n");
});
