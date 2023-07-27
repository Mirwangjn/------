
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
    return xhlAdepter(config).then((response) => {
        // console.log(response.headers);
        // let result = response.Headers.replace(/\r\n/g, "").replace(/ /g, "");
        //处理请求头信息
        let result = response.headers.split("\r\n");
        result.pop();
        let obj = {};
        result.forEach((ele) => {
            let newArr = ele.split(":");
            obj[newArr[0]] = newArr[1].replace(" ", "");
        });
        response.headers = obj;
        // try {
        //     response.data = JSON.parse(response.data)
        // } catch (error) {

        // }
        //处理头信息 end
        //用于处理xx类型的数据，对应功能为：responseType
        const handleType = {
            text(response) {//为response

                return response.data.toString();
            },
            json(response) {
                try {
                    // configuration.data = JSON.parse(configuration.data);
                    return JSON.parse(response.data)
                } catch (error) {
                    return response.data;
                }
            },
        };
        //如果设置了responseType且属性值为json则帮其转换
        // if (response.responseType && response.responseType === "json") {

        // }
        //防止他人瞎乱改，把responseType设置为空字符串
        config.responseType = config.responseType || "json"
            //当以数组形式直接调用函数时，需注意上面地分号
            ;["text", "json"].forEach(key => {
                if (config.responseType === key) {
                    // console.log(handleType[key]);
                    response.data = handleType[key](response);//handleType.json(response)
                }
            });
        // console.log(response.data);
        // console.log(obj);
        // console.log(result);
        return response;
    })
};
//由这个函数来发送请求
function xhlAdepter(config) {
    return new Promise((resolve, reject) => {
        //遍历请求头
        function handleHeader(headers) {
            //首先判断是否配置对象config中有headers属性
            if (headers) {
                //判断发送的config.data类型来配置content-type的请求头是application/json还是application/x-www-form-urlencoded
                if(config.data instanceof URLSearchParams || typeof config.data === "string") {
                    headers["content-type"] = "application/x-www-form-urlencoded";
                } else if(config.data instanceof Object) {
                    headers["content-type"] = "application/json";
                };
                // config.data instanceof URLSearchParams || typeof config.data === "string" ? 
                // headers["content-type"] = "application/x-www-form-urlencoded" : config.data instanceof Object ? headers["content-type"] = "application/json" : "";
                //通过changeSendType配置项改变对象的请求头
                if(config.changeSendType) {
                    headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
                }
                for (let key in headers) {
                    if (Object.hasOwnProperty.call(headers, key)) {
                                xhl.setRequestHeader(key, headers[key]);
                        }
                        //配置对象的头参数必须都是string类型 
                    }

                }
            
        };
        //用来把对象改变为符合键值对的样子 {id:1,password:8} => id=1&password=8(返回值)
        function handleObject (changeString){
            let num = 1;
            let str = "";
            for (let key in changeString) {
                if (Object.hasOwnProperty.call(changeString, key)) {
                    if (num === 1) {
                        str += `${key}=${changeString[key]}`;
                        num++;
                    } else {
                        str += `&${key}=${changeString[key]}`;
                    }
                }
            };
            return str;
        };
        /**
         *   //将params此参数转化为字符串添加到send中，
         * 以id=1&wa=9的形式
         */
        function handleData(changeData) {
            let str = "";
            // let num = 1;
            //判断参数是否URLSearchParams
            if (changeData instanceof URLSearchParams) {
                config.data = str = changeData.toString();
                // str = data.toString();
                //这一步为了让config的显示
                // config.data = str
            } else
                //所以的东西都继承了Object类所以如果data为数组的话也会进这里面
                if (changeData instanceof Object) {
                    /*
                        是对象则执行里面.但是需要注意下列是将对象手动转化为键值对的字符串
                        但是这样就只能发送urlencoded的content-type,接下来改进
                    */ 
                   if (config.changeSendType) {
                    // for (let key in changeData) {
                    //     if (Object.hasOwnProperty.call(changeData, key)) {
                    //         if (num === 1) {
                    //             str += `${key}=${changeData[key]}`;
                    //             num++;
                    //         } else {
                    //             str += `&${key}=${changeData[key]}`;
                    //         }
                    //     }
                    // };
                    str = handleObject(changeData)
                   } else{
                        str = JSON.stringify(config.data);
                   }
                    
                   //end
                } else
                    //如果是字符串则直接赋值
                    if (typeof changeData === "string") {
                        str = changeData;
                    };
                    // if(typeof data === "string") str = data;
            return str;
        };
        //将data于params拆分
        function handleParams(changeParams){
            let str = "";
            // let num = 1;
            if(changeParams instanceof Object) {
                //     for (let key in changeParams) {
                //     if (Object.hasOwnProperty.call(changeParams, key)) {
                //         if (num === 1) {
                //             str += `${key}=${changeParams[key]}`;
                //             num++;
                //         } else {
                //             str += `&${key}=${changeParams[key]}`;
                //         }
                //     }
                // };
                str = handleObject(changeParams);
            } else if(typeof changeParams === "string") {
                str = changeParams;
            };
            
            return str;
        }
        const xhl = new XMLHttpRequest();
        // xhl.open(config.method,config.url);
        // console.log(`${config.url}?${handleData(config.params)}`);
        //如果直接就是没有参数就会有 ？
        // xhl.open(config.method,`${config.url}?${handleData(config.params)}`);
        if (!handleParams(config.params)) {
            //如果参数为空字符串,空对象，或者没写 和 undefined进这里
            xhl.open(config.method, config.baseURL + config.url);//字符串拼凑
        } else {
            // 有参数进这里
            xhl.open(config.method, `${config.baseURL}${config.url}?${handleParams(config.params)}`);
        };
        handleHeader(config.headers);//此方法用来遍历请求头
        // xhl.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        // xhl.setRequestHeader('content-type', 'application/json');
        // xhl.setRequestHeader("a","11")
        //设置超时取消请求
        xhl.timeout = config.timeout;
        xhl.ontimeout = function () {
            console.error("请求超时了!!小牛🐎");
        };//超时结束
         xhl.send(handleData(config.data) || null);
        xhl.onreadystatechange = function () {
            if (xhl.readyState === 4) {
                if (xhl.status >= 200 && xhl.status < 300) {
                    resolve({
                        //配置对象
                        config,
                        //响应体
                        data: xhl.response,
                        //所有的响应头
                        headers: xhl.getAllResponseHeaders(),
                        // 内部生成的实例xhl对象
                        request: xhl,
                        status: xhl.status,
                        statusText: xhl.statusText
                    })
                } else {
                    reject(new Error("请求失败或超时请求"));

                }
            }
        };
        //取消请求条件
        if (config.cancelToken) {
            config.cancelToken.promise.then(res => {
                xhl.abort();
            })
        };
        //取消请求提示
        xhl.onabort = function () {
            console.warn("取消请求了小🐂🐎！！！！！!")
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
    adapter: ['xhr'],
    baseURL: "",
    data:{},
    params:{},
    timeout: 0,
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
//合并配置对象但是头信息只是添加到defaultConfig中
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