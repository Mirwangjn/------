
const typeOfTest = type => thing => typeof thing === type;
//cache的作用是作为存储，避免过多的重复执行
const kindOf = (cache => thing => {
    // "[object Type]"
    const str = toString.call(thing);
    // [object Number] ---> number
    return cache[str] || (cache[str] = (str.slice(8, -1).toLowerCase()));
    //立即将Object.create(null)作为参数传递给了kindOf函数，从而创建了一个具有缓存功能的kindOf函数。
})(Object.create(null));

const kindOfTest = (type) => {
    type = type.toLowerCase();
    return (thing) => kindOf(thing) === type;
}

/**判断值是否为undefined
 * @param {*} value
 * 
 * @return {boolean}
 */
const isUndefined = typeOfTest("undefined");
/**判断值是否为null
 * @param {*} value
 * 
 * @return {boolean}
 */
const isNull = kindOfTest("null");
//判断值是否为URLSearchParams实例
/**判断值是否为null
 * @param {*} value
 * 
 * @return {boolean}
 */
const isURLSearchParams = kindOfTest("URLSearchParams");

/**判断值是否为对象(不算null)
 * @param {*} thing
 * 
 * @return {boolean}
 */
const isObject = (thing) => thing !== null && typeof thing === "object";
/**
 * @param {string} 
 * @returns {boolean}
 */
const isArray = kindOfTest("Array");

const isBoolean = (thing) => thing === true || thing === false;

const isString = typeOfTest("string");

const isFunction = typeOfTest("function");

// function 
//返回通过识别值类型后而改变的headers
function handleHeader(headers, config) {
    //首先判断是否配置对象config中有headers属性
    if (headers) {
        //判断发送的config.data类型来配置content-type的请求头是application/json还是application/x-www-form-urlencoded
        if (config.data instanceof URLSearchParams || typeof config.data === "string" || config.changeSendType) {
            headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
        } else if (config.data instanceof Object) {
            headers["content-type"] = "application/json";
        };
        // config.data instanceof URLSearchParams || typeof config.data === "string" ? 
        // headers["content-type"] = "application/x-www-form-urlencoded" : config.data instanceof Object ? headers["content-type"] = "application/json" : "";
        //通过changeSendType配置项改变对象的请求头

    }
    //返回通过识别值类型后而改变的headers
    return headers;
};
//将对象加工返回值为键值对的字符串 {id:"001",password:"1233"} ----> "id=001&password=1233"
function handleObject(changeToString) {
    let num = 1;
    let str = "";
    forEach(changeToString, (key, val) => {
        if (num === 1) {
            str += `${key}=${val}`;
            num++;
        } else {
            str += `&${key}=${val}`;
        }
    });

    return str;
};
//如果是urSearchParams则转换为字符串。是对象根据配置则还需要根据changeSendType配置来进一步判断
//字符串则直接转交
function handleData(change, fn) {

    let data = "";
    //最后应该写"" 因为change为null或undefinied时会有问题
    data = isURLSearchParams(change) ? change.toString() : isString(change)
        ? change : isObject(change) ? JSON.stringify(change) : "";

    //回调函数中的参数为经过类型判断而改变后的值，然后把这个值交出去
    return fn && fn(data, change);

}
//处理params配置 {id:1} => id:1
function handleParams(changeParams) {
    let str = "";
    if (isObject(changeParams)) {

        str = handleObject(changeParams);
    } else if (isString(changeParams)) {
        str = changeParams;
    };
    //拼凑字符串 => ?id=1...
    return str;
};
/**
 * 处理data参数为数组时，代表着["id"] ---> "id=id"
 * @param {Array<string>} changeArray 
 * @returns {string}
 */
function handleArray(changeArray) {
    let result = {};
    try {
        forEach(changeArray, (item) => {
            result[item] = item;
        })
    } catch (error) {
        console.log("使用数组类型时value必须为string类型&&" + error.message);
    }
    return handleObject(result);
};

function recognizeHttpType(protocolType) {
    // 1.因为protocol协议值为 http: 所以需要替换一下
    protocolType = protocolType.replace(":", "");
    return protocolType;
};

/*
合并配置对象但是头信息只是添加到defaultConfig中,但不会覆盖
defaultConfig为我的默认default，config为他人传递的配置
*/
function configMerge(defaultConfig, config) {
    let changeHeaders;
    //Object.keys获取null和undefined会报错
    // forin在获取null和undefined不会报错
    forEach(config.headers, (key, val) => {
        if (Object.hasOwn(config.headers, key)) {
            // defaultConfig.headers[key] = config.headers[key];
            defaultConfig.headers[key] = val;
        }
    })
    //获得由defaultConfig和config.headers的信息集合
    changeHeaders = defaultConfig.headers;
    /*
    Object.assign() 不会在源对象值为 null 或 undefined 时抛出错误。
    const configMergeResult = Object.assign(defaultConfig, config, {headers:changeHeaders}); --->另一种写法，但是在阅读性上有点不行
    */
    const configMergeResult = Object.assign(defaultConfig, config);

    return { ...configMergeResult, headers: changeHeaders };
};
//深度检测
function deepCheckType(obj, constructor) {
    if (obj === null || obj === undefined || constructor === null || constructor === undefined) return false;
    while (obj.__proto__ !== null) {
        if (obj.__proto__ === constructor.prototype) {
            return true;
        } else {
            obj = obj.__proto__;
        }
    }
    return false;
};
/**
 * 
 * @param {object | Array<any>} element 
 * @param {Function} fn 
 * @returns {void};
 */
function forEach(element, fn, { allOwnKey = false } = {}) {
    if (element === null && element === undefined) return;
    let len;
    if (isArray(element)) {
        len = element.length;
        for (let i = 0; i < len; i++) {
            fn && fn.call(null, element[i], i);
        }
        // element.forEach((item,index) => {
        //     fn && fn.call(null,item,index);
        // });
    } else if (isObject(element)) {
        /*
        getOwnPropertyNames与keys区别是 1.其包含给定对象中所有自有属性（包括不可枚举属性，但不包括使用 symbol 值作为名称的属性）。
        2.返回一个由给定对象自身的可枚举的字符串键属性名组成的数组
        */
        const keys = allOwnKey ? Object.getOwnPropertyNames(element) : Object.keys(element);
        len = keys.length;
        for (let i = 0; i < len; i++) {
            let key = keys[i];
            fn && fn.call(null, key, element[key]);
        }
        // for (const key in element) {
        //     if (Object.hasOwn(element, key)) {
        //         fn && fn.call(null,key,element);
        //     }
        // }
    }
};

function kindKey(obj, key) {
    key = key.toLowerCase();

    const keyObj = Object.keys(obj);

    let _key;

    let len = keyObj.length;

    while (len-- < 0) {
        //拿到键
        _key = keyObj[len];
        if (key === _key.toLowerCase()) {
            return obj[_key];
        }
    }
    return null;
};
//金牌打手，猎物，雇主
function extend(target, hunted, thisArg, { allOwnKey } = {}) {
    forEach(hunted, (key, val) => {

        if (thisArg && isFunction(val)) {

            target[key] = val.bind(thisArg);

        } else {

            target[key] = val;
        }

    }, { allOwnKey });
};

module.exports = {
    isUndefined,
    isNull,
    isURLSearchParams,
    isObject,
    isArray,
    isBoolean,
    isString,
    isFunction,
    deepCheckType,
    handleHeader,
    handleObject,
    handleData,
    handleParams,
    handleArray,
    recognizeHttpType,
    configMerge,
    forEach,
    kindKey,
    extend
}