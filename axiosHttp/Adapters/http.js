const http = require("node:http");
const https = require("node:https");
const {handleData,handleHeader,handleParams,recognizeHttpType} = require("../utils");
const {CancelToken} = require("../core/CancelToken");
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
            hostname: url.hostname,
            path:`${url.pathname}?${handleParams(config.params)}`,
            port: url.port,
            method:config.method || "get",
            headers:handleHeader(config.headers,config)
        }
        //res与服务器的res功能差不多
        const httpResponse = protocol.request(options,res =>{
            //数据汇总
            let str = "";
            res.on("data",(data) =>{str += data});
            res.on("end" ,() =>{
                resolve({
                    // 配置
                    config,
                    //响应结果
                    data:str,
                    //res.headers不是一个函数
                    headers: res.headers,
                    //res.statusCode为响应状态码
                    status:res.statusCode,
                    //res.statusMessage为响应状态信息
                    statustext:res.statusMessage
                });
            });
            res.on("error",(err) =>{
                reject({
                    config,
                     //res.statusCode为响应状态码
                     status:res.statusCode,
                     //res.statusMessage为响应状态信息
                     statustext:res.statusMessage,
                     message:err.message
                })
            })
        });
        //表示请求已完成，或者其底层连接提前终止（在响应完成之前）。
        httpResponse.on("close",() =>{console.warn("请求超时了小🐂🐎！其实这个函数成功了也执行")});
        httpResponse.on("error",(err) =>{
            console.log("请求出错" + err.message);
            // throw err;
        });
        //如同xhl的send()
        httpResponse.write(handleData(config.data,config));
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