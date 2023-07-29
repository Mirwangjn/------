  //返回通过识别值类型后而改变的headers
  function handleHeader(headers,config) {
    //首先判断是否配置对象config中有headers属性
    if (headers) {
        //判断发送的config.data类型来配置content-type的请求头是application/json还是application/x-www-form-urlencoded
        if (config.data instanceof URLSearchParams || typeof config.data === "string") {
            headers["content-type"] = "application/x-www-form-urlencoded";
        } else if (config.data instanceof Object) {
            headers["content-type"] = "application/json";
        };
        // config.data instanceof URLSearchParams || typeof config.data === "string" ? 
        // headers["content-type"] = "application/x-www-form-urlencoded" : config.data instanceof Object ? headers["content-type"] = "application/json" : "";
        //通过changeSendType配置项改变对象的请求头
        if (config.changeSendType) {
            headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
        }
        for (let key in headers) {
            if (Object.hasOwnProperty.call(headers, key)) {

            }
            //配置对象的头参数必须都是string类型 
        }

    }
    //返回通过识别值类型后而改变的headers
    return headers;
};
//将对象加工返回值为键值对的字符串
function handleObject(changeString) {
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
//如果是urSearchParams则转换为字符串。是对象根据配置则还需要根据changeSendType配置来进一步判断
//字符串直接转交
function handleData(changeData,config) {
    let str = "";
    //判断参数是否URLSearchParams
    if (changeData instanceof URLSearchParams) {
        config.data = str = changeData.toString();
        //这一步为了让config的显示
    } else
        //所以的东西都继承了Object类所以如果data为数组的话也会进这里面
        if (changeData instanceof Object) {
            /*
                是对象则执行里面.但是需要注意下列是将对象手动转化为键值对的字符串
                但是这样就只能发送urlencoded的content-type,接下来改进
            */
            if (config.changeSendType) {

                str = handleObject(changeData)
            } else {
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
//处理params配置 {id:1} => id:1
function handleParams(changeParams) {
    let str = "";
    if (changeParams instanceof Object) {

        str = handleObject(changeParams);
    } else if (typeof changeParams === "string") {
        str = changeParams;
    };
    //拼凑字符串 => ?id=1...
    return str;
};
function recognizeHttpType(protocolType) {
    // 1.因为protocol协议值为 http: 所以需要替换一下
    protocolType = protocolType.replace(":", "");
    return protocolType;
};
module.exports ={
    handleHeader,
    handleObject,
    handleData,
    handleParams,
    recognizeHttpType
}