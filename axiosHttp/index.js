const { configMerge ,extend } = require("./utils");
const Axios = require("./core/Axios");


//创建默认配置对象
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

// defaultConfig为一些基本的配置
/**
 * 创建实例
 * 
 * @param {Object} defaultConfig 
 * @returns {Axios}
 */
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
    // Object.keys(Axios.prototype).forEach(key => {
    //     instance[key] = Axios.prototype[key].bind(context);
    // });
    extend(instance,Axios.prototype,context,{allOwnKey: true});
    //获得实例的属性，方法是挂载到原型身上的，所以不会拿到
    // Object.keys(context).forEach(key => {
    //     instance[key] = context[key];
    // })
    extend(instance,context,null,{allOwnKey: true});
    return instance;
    
};


const axios = createInstance(defaults);//传入值为axios默认的配置对象



axios.create =  function (config) {
    const createConfig = configMerge(defaults, config);
    // console.log(createConfig);
    return createInstance(createConfig);
};
axios.Axios = Axios;
module.exports = {
    axios
};