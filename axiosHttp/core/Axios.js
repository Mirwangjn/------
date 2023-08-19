// const { configMerge } = require("../utils");
const InterceptorManager = require("./InterceptorManager");
const dispatchRequest = require("./dispatchRequest")
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
const defaults = {
    //配置器
    adapter: ["xhr", "http"],
    baseURL: "",
    timeout: 0,
    //取消请求
    cancelToken: "",
    // 设置请求头
    headers: {
        'Accept': 'application/json, text/plain, */*',
        // 'content-type': 'application/x-www-form-urlencoded',
        // 'content-type':"application/json"
    },
    //响应格式
    responseType: "json",
    //自定义属性，用于改变请求头的类型 把application/json => application/x-www-form-urlencoded
    changeSendType: false,
    /*
    说明:因为axios是根据数据的类型来发送不同的头.也就是说如果你的数据是对象那么发送的就是
    application/json,是字符串或者URLSearchParams则发送application/x-www-form-urlencoded
    而这个属性就是帮你把对象类型发送application/x-www-form-urlencoded请求头。
    */

};
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
    //
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
        return { ...defaultConfig, ...config, headers: changeHeaders }
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
};
module.exports = Axios;