function Axios(instanceConfig){
    this.default = instanceConfig;
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
        request:new InterceptorManager(),
        response:new InterceptorManager()
    }
};
//实现拦截器
function InterceptorManager(){
    this.handlers = [];
}
InterceptorManager.prototype.use = function(fulfilled,rejected){
    //use的作用是将参数添加到handlers身上，然后遍历添加到chain中，然后在遍历运行chain
    this.handlers.push({
        fulfilled,
        rejected
    })
}
function dispatchRequest(config){
    //这一步是用来对数据进行整理
    return xhlAdepter(config).then((response) =>{
        // console.log(response.Headers);
        

        return response
    })
};
//由这个函数来发送请求
function xhlAdepter(config){

    return new Promise((resolve,reject) =>{
        const xhl = new XMLHttpRequest();
        xhl.open(config.method,config.url);
        // xhl.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
        xhl.send();
        xhl.onreadystatechange = function(){
            if(xhl.readyState === 4){
                if(xhl.status >= 200 && xhl.status < 300){
                    resolve({
                        //配置对象
                        config,
                        //响应体
                        data:xhl.response,
                        //所有的响应头
                        Headers :xhl.getAllResponseHeaders(),
                        // 内部生成的实例xhl对象
                        request: xhl,
                        status: xhl.status,
                        statusText: xhl.statusText 
                    })
                } else{
                    reject(new Error("请求失败"))
                }
            }
        };
        //取消请求条件
        if(config.cancelToken){
            config.cancelToken.promise.then(res =>{
                xhl.abort()
            })
        }
    })
};
//取消请求功能,参数为一个函数
/*
    取消请求是通过判断config参数是否拥有cancelToken属性
    再通过promise来判断是否取消请求
*/ 
function CancelToken(executor){
    let resolvePromise;
    
    this.promise = new Promise((resolve,reject) =>{
        //将改变状态的使用权给到resolvePromise
        resolvePromise = resolve;
    });
    //如果函数调用，则promise的状态改变，然后取消请求
    executor(function(){
        // 将函数暴漏
        resolvePromise();
    })
}
//通过request发送请求
Axios.prototype.request = function(config){
    // console.log("request请求"+ config.method);
    //传入的参数在先，修改在后
    let promise = Promise.resolve(config);
    
    let chains = [dispatchRequest,undefined];
    //添加请求拦截器函数
    this.interceptors.request.handlers.forEach(manyFn =>{
       chains.unshift(manyFn.fulfilled,manyFn.rejected);
    });
    //添加响应拦截器函数
    this.interceptors.response.handlers.forEach(manyFn =>{
        chains.push(manyFn.fulfilled,manyFn.rejected);
    })
    // console.log(chains);
    // 拦截器函数添加完成，进行遍历
    let i = 0;
    while(chains.length > i){
        // promise.then(chains.shift(),chains.shift());//老源码写法
        promise = promise.then(chains[i++],chains[i++]);//新源码写法
    }

    // let result = promise.then(chains[0],chains[1]);
    return promise;
};
// get和post内部是调用了request请求
Axios.prototype.get = function(url,config){
    config.method = "get";
    config.url = url
    const promise = this.request(config);
    return promise;
};
Axios.prototype.post = function(config){
    config.url = url
    const promise = this.request(config)
    return promise;
};
// Axios.prototype.getUri = function(config){};
// defaultConfig为一些基本的配置
function createInstance(defaultConfig){
    const context = new Axios(defaultConfig);
    //让Axios.prototype.request的this指向实例对象context（保险）
    const instance = Axios.prototype.request.bind(context);
    /*
        //将实例对象的方法和属性全部添加给instance
        //返回值为数组
        //相当于添加静态方法
        4.这一步只是把原型上的方法挂载到instance身上
    */
    Object.keys(Axios.prototype).forEach(key =>{
        instance[key] = Axios.prototype[key].bind(context);
    });
    //获得实例的属性，方法是挂载到原型身上的，所以不会拿到
    Object.keys(context).forEach(key =>{
        instance[key] = context[key]
    })
    // console.dir(instance);
    return instance;
};
//赋值
const axios = createInstance({method:"get"});//传入值为axios默认的配置对象
// axios.request({method:"post"})