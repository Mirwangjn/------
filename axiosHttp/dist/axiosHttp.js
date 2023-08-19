const http = require("node:http");
const https = require("node:https");
const { handleData, handleHeader, configMerge, handleParams, recognizeHttpType } = require("../utils");
function Axios(instanceConfig) {
    this.defaults = instanceConfig;
    /*
        拦截器内部实现原理为：将拦截器的函数存储起来，然后遍历添加到chains数组上
        请求拦截器使用unshift()添加到chains数组前面;而响应拦截器使用push添加到后面
        所以存在两个请求拦截器时，会先执行第2个，然后在执行第一个
        [two(config),two(error),one(config),one(error),dispatchRequest,undefined，。。。]
        源码为：chain.unshift(interceptor.fulfilled,interceptor.rejected)
        while(chain.length){promise = promise.then(chain.shift(),chain.shift())}
        这是undefined有着极大的作用。如果请求的promise状态为rejected，在执行到undefined时
        promise会异常穿透(你不写内部帮你生成)
    */

    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    }
};
//实现拦截器
function InterceptorManager() {
    this.handlers = [];
}
InterceptorManager.prototype.use = function (fulfilled, rejected) {
    //use的作用是将参数添加到handlers身上，然后遍历添加到chain中，然后在遍历运行chain
    this.handlers.push({
        fulfilled,
        rejected
    })
}
function dispatchRequest(config) {
    //这一步是用来对数据进行整理
    return httpAdepter(config).then((response) => {
        // console.log(config,response);
        // //用于处理xx类型的数据，对应功能为：responseType
        // const handleType = {
        //     text(response) {//为response

        //         return response.data.toString();
        //     },
        //     json(response) {
        //         try {
        //             // configuration.data = JSON.parse(configuration.data);
        //             return JSON.parse(response.data)
        //         } catch (error) {
        //             return response.data;
        //         }
        //     },
        // };
        // //如果设置了responseType且属性值为json则帮其转换
        // //防止他人瞎乱改，把responseType设置为空字符串
        // config.responseType = config.responseType || "json"
        //     //当以数组形式直接调用函数时，需注意上面地分号
        //     ;["text", "json"].forEach(key => {
        //         if (config.responseType === key) {
        //             // console.log(handleType[key]);
        //             response.data = handleType[key](response);//handleType.json(response)
        //         }
        //     });
        return response;
    })
};
//由这个函数来发送请求
function httpAdepter(config) {
    return new Promise((resolve, reject) => {
        //可能性1.直接就是url; 2.baseURL + url 
        // 3.baseURL不只是base(http://127.0.0.1:8080) =>统一的特点就是他们都需要拼接
        const url = new URL(`${config.baseURL}${config.url}?${handleParams(config.params)}`);

        //识别发送的HTTP还是HTTPs协议 && 如果没写协议默认为http协议
        let protocol = recognizeHttpType(url.protocol);//值为：http || https

        //字符串不能当变量用
        protocol === "http" ? protocol = http : protocol = https;

        //配置参数
        const options = {
            //域名 => 127.0.0.1
            hostname: url.hostname,
            //路径资源 /api/post?id=0
            path: `${url.pathname}?${handleParams(config.params)}`,
            //端口
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
//取消请求功能,参数为一个函数
/*
    取消请求是通过判断config参数是否拥有cancelToken属性
    再通过promise来判断是否取消请求
*/
function CancelToken(executor) {
    let resolvePromise;

    this.promise = new Promise((resolve, reject) => {
        //将改变状态的使用权给到resolvePromise
        resolvePromise = resolve;
    });
    //如果函数调用，则promise的状态改变，然后取消请求
    executor(function () {
        // 将函数暴漏
        resolvePromise();
    })
};
//创建默认配置对象
const defaults = {
    //配置器
    adapter: ['xhr,http'],
    baseURL: "",
    data: {},
    params: {},
    timeout: 0,
    cancelToken: "",
    headers: {
        'Accept': 'application/json, text/plain, */*',
        // 'content-type': 'application/x-www-form-urlencoded',
        // 'content-type':"application/json"
    },
    responseType: "json",
    //自定义属性，用于改变请求头的类型
    changeSendType: false,
};
//通过request发送请求
Axios.prototype.request = function (configUrl, config) {
    //axios在支持只写网址的
    if (typeof configUrl === "string") {
        //如果没写则为空对象
        config = config || {};
        config.url = configUrl;
    } else {
        //不是string，而是对象之类的话
        config = configUrl || {};
    };
    //判断是否有些请i求
    config.method = config.method || "get";
    //合并默认配置对象和用户所传递的参数，但缺陷是我的配置如果是空对象会直接覆盖我的默认配置对象
    // const merge = { ...defaults, ...config };
    function configMerge(defaultConfig, config) {
        let changeHeaders;
        //Object.keys获取null和undefined会报错
        // Object.keys(config.headers).forEach((eleConfig,index) =>{
        //     // headers请求头不可以覆盖，其他可以
        //     defaultConfig.headers[eleConfig] = config.headers[eleConfig];
        // });
        // forin在获取null和undefined不会报错
        for (const key in config.headers) {
            defaultConfig.headers[key] = config.headers[key];
        };
        changeHeaders = defaultConfig.headers;
        // console.log(changeHeaders);
        return { ...defaults, ...config, headers: changeHeaders }
    };
    const merge = configMerge(defaults, config);
    // console.log(merge);
    //传入的参数在先，修改在后
    let promise = Promise.resolve(merge);

    let chains = [dispatchRequest, undefined];
    //添加请求拦截器函数
    this.interceptors.request.handlers.forEach(manyFn => {
        chains.unshift(manyFn.fulfilled, manyFn.rejected);
    });
    //添加响应拦截器函数
    this.interceptors.response.handlers.forEach(manyFn => {
        chains.push(manyFn.fulfilled, manyFn.rejected);
    })
    // console.log(chains);
    // 拦截器函数添加完成，进行遍历
    let i = 0;
    while (chains.length > i) {
        // promise.then(chains.shift(),chains.shift());//老源码写法
        promise = promise.then(chains[i++], chains[i++]);//新源码写法
    }

    // let result = promise.then(chains[0],chains[1]);
    return promise;
};
// get和post内部是调用了request请求
Axios.prototype.get = function (url, config) {
    config.method = "get";
    config.url = url
    const promise = this.request(config);
    return promise;
};
Axios.prototype.post = function (url, config) {
    config.method = "post";
    config.url = url
    const promise = this.request(config)
    return promise;
};
// 获取完整的url
Axios.prototype.getUri = function (config) {
    const url = config.baseURL || this.defaults.baseURL;
    return url + config.url;
}
// Axios.prototype.getUri = function(config){};
// defaultConfig为一些基本的配置
function createInstance(defaultConfig) {
    const context = new Axios(defaultConfig);
    //让Axios.prototype.request的this指向实例对象context（保险）
    const instance = Axios.prototype.request.bind(context);
    /*
        //将实例对象的方法和属性全部添加给instance
        //返回值为数组
        //相当于添加静态方法
        4.这一步只是把原型上的方法挂载到instance身上
    */
    Object.keys(Axios.prototype).forEach(key => {
        instance[key] = Axios.prototype[key].bind(context);
    });
    //获得实例的属性，方法是挂载到原型身上的，所以不会拿到
    Object.keys(context).forEach(key => {
        instance[key] = context[key]
    })
    // console.dir(instance);
    return instance;
};
//赋值
const axios = createInstance(defaults);//传入值为axios默认的配置对象
// axios.request({method:"post"})
//返回值为一个新的配置对象
axios.create = function (config) {
    const createConfig = configMerge(defaults, config);
    // console.log(createConfig);
    return createInstance(createConfig)
}
//向外导出
module.exports = axios;