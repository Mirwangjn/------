const http = require("node:http");
const https = require("node:https");
const { handleData, handleHeader, handleParams, recognizeHttpType } = require("../utils");
const { CancelToken } = require("../core/CancelToken");
//由这个函数来发送请求
function httpAdepter(config) {
    return new Promise((resolve, reject) => {
        //可能性1.直接就是url; 2.baseURL + url 
        // 3.baseURL不只是base(http://127.0.0.1:8080) =>统一的特点就是他们都需要拼接
        const url = new URL(`${config.baseURL}${config.url}?${handleParams(config.params)}`);

        //识别发送的HTTP还是HTTPs协议 && 如果没写协议默认为http协议
        let protocol = recognizeHttpType(url.protocol);//值为：http || https

        //字符串不能当变量用 => 通过发送的地址并拆解而得出的协议
        protocol === "http" ? protocol = http : protocol = https;

        //配置参数
        const options = {
            //域名 => 127.0.0.1
            hostname: url.hostname,
            //路径资源 /api/post?id=0&password=wang
            path: `${url.pathname}?${handleParams(config.params)}`,
            //端口 => 如果为空则表示默认端口
            port: url.port,
            //请求方式
            method: config.method || "get",
            //配置请求头 =>根据值类型来判断发送什么请求头
            headers: handleHeader(config.headers, config)
        };

        //res与服务器的res功能差不多
        const httpResponse = protocol.request(options, res => {
            //数据汇总
            let str = "";

            const handleType = {
                text(response) {//为response

                    return response.toString();
                },
                json(response) {
                    try {
                        return JSON.parse(response);
                    } catch (error) {
                        //如果json转换除了问题进这里
                        return response;
                    }
                },

            };
            /*
            1.需注意stream流不应该在end事件里面写，而是在开始接收数据之前来去判断
            2.如果是在end事件的时候去判断responseType的类型，那么then方法回调的流就没有作用了。
            3.stream流无法于text和json选项一块使用，因为json和text是在数据完成之后进行加工
            */
            if (config.responseType === "stream") {
                resolve({
                    // 配置
                    config,
                    //响应结果
                    data: res,
                    //res.headers不是一个函数
                    headers: res.headers,
                    //res.statusCode为响应状态码
                    status: res.statusCode,
                    //res.statusMessage为响应状态信息
                    statustext: res.statusMessage
                });
                //如果函数进入到这个就return退出这个函数
                return;
            };

            res.on("data", (data) => { str += data });

            res.on("end", () => {
                //如果设置了responseType且属性值为json则帮其转换
                //防止他人瞎乱改，把responseType设置为空字符串
                config.responseType = config.responseType || "json";
                //当以数组形式直接调用函数时，需注意上面地分号
                ["text", "json"].forEach(key => {
                    if (config.responseType === key) {
                        str = handleType[key](str);//handleType.json(response)
                    }
                });

                //返回数据
                resolve({
                    // 配置
                    config,
                    //响应结果
                    data: str,
                    //res.headers不是一个函数
                    headers: res.headers,
                    //res.statusCode为响应状态码
                    status: res.statusCode,
                    //res.statusMessage为响应状态信息
                    statustext: res.statusMessage
                });

            });

            res.on("error", (err) => {
                reject({
                    config,
                    //res.statusCode为响应状态码
                    status: res.statusCode,
                    //res.statusMessage为响应状态信息
                    statustext: res.statusMessage,
                    message: err.message
                })
            })


        });
        //表示请求已完成，或者其底层连接提前终止（在响应完成之前）。
        httpResponse.on("close", () => { console.warn("请求超时了小🐂🐎或者成功了！你猜是哪个。") });

        httpResponse.on("error", (err) => {
            console.error("请求出错" + err.message);
            // throw err;
        });

        //如同xhl的send()
        httpResponse.write(handleData(config.data, config));

        //发送请求
        httpResponse.end();

        //取消请求条件
        if (config.cancelToken instanceof CancelToken) {
            config.cancelToken.promise.then(res => {
                //    取消请求 
                httpResponse.abort();
            })
        };

    })
};
module.exports = httpAdepter;
// //用于处理xx类型的数据，对应功能为：responseType

