function Axios(instanceConfig){
    this.default = instanceConfig;
    this.interceptors = {
        request:{},
        response:{}
    }
};
function dispatchRequest(config){
    //这一步是用来对数据进行整理
    return xrlAdepter(config).then((response) =>{
        // console.log(response.Headers);
        

        return response
    })
};
//由这个函数来发送请求
function xrlAdepter(config){

    return new Promise((resolve,reject) =>{
        const xrl = new XMLHttpRequest();
        xrl.open(config.method,config.url);
        xrl.send();
        xrl.onreadystatechange = function(){
            if(xrl.readyState === 4){
                if(xrl.status >= 200 && xrl.status < 300){
                    resolve({
                        //配置对象
                        config,
                        //响应体
                        data:xrl.response,
                        //所有的响应头
                        Headers :xrl.getAllResponseHeaders(),
                        // 内部生成的实例xrl对象
                        request: xrl,
                        status: xrl.status,
                        statusText: xrl.statusText 
                    })
                } else{
                    reject(new Error("请求失败"))
                }
            }
        }
    })
}
//通过request发送请求
Axios.prototype.request = function(config){
    // console.log("request请求"+ config.method);
    let promise = Promise.resolve(config);
    let chains = [dispatchRequest,undefined];
    let result = promise.then(chains[0],chains[1]);
    return result
};
// get和post内部是调用了request请求
Axios.prototype.get = function(config){
    this.request({method:"get"})
};
Axios.prototype.post = function(config){
    this.request({method:"post"})
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
const axios = createInstance();//传入值为axios默认的配置对象
// axios.request({method:"post"})