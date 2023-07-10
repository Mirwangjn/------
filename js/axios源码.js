function Axios(instanceConfig){
    this.default = instanceConfig;
    this.interceptors = {
        request:{},
        response:{}
    }
};
//通过request发送请求
Axios.prototype.request = function(config){
    console.log("request请求"+ config.method);
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