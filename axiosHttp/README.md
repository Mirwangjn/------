## 使用说明
```js
    wang({
        //起始地址
        baseURL:"http://127.0.0.1:8080",

        url:"pong/get",

        method:"post",

        data:{id:"001",username:"admin",password:"123456"},

        params:{token:"dhuasihduiadiuadghasd"},

        headers:{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYsInVzZXJuYW1lIjoiYWRtaW4iLCJwYXNzd29yZCI6IiIsIm5pY2tuYW1lIjpudWxsLCJlbWFpbCI6bnVsbCwidXNlX3BpYyI6IiIsImlhdCI6MTY5MTY1ODcwOCwiZXhwIjoxNjkxNjk0NzA4fQ.4ndXUlmu-GbP7tQ4dnVcwlaSZH_13mHAfhLPBP04LtQ"},

        responseType:"json",

        changeSendType:true,
        
}).then(response =>{
    ......
})
```

## 属性介绍
    说明:因为axios是根据data配置项的参数类型来发送不同的头.也就是说如果你的数据是对象那么发送的就是
    application/json,是字符串或者URLSearchParams则发送application/x-www-form-urlencoded
    而这个属性就是帮你把对象类型发送application/x-www-form-urlencoded请求头。
    
```js
    const defaults = {
    //配置器
    adapter: ["xhr", "http"],
    baseURL: "",
    //设置超时时间
    timeout: 0,
    //取消请求
    cancelToken: undefined,
    // 设置请求头
    headers: {
        'Accept': 'application/json, text/plain, */*',
        // 'content-type': 'application/x-www-form-urlencoded',
        // 'content-type':"application/json"
    },
    //响应格式 =>text,json,stream
    responseType: "json",
    //自定义属性，用于改变请求头的类型 把application/json => application/x-www-form-urlencoded
    changeSendType: false, //default: false
    /*
    说明:因为axios是根据数据的类型来发送不同的头.也就是说如果你的数据是对象那么发送的就是
    application/json,是字符串或者URLSearchParams则发送application/x-www-form-urlencoded
    而这个属性就是帮你把对象类型发送application/x-www-form-urlencoded请求头。
    */
   //发送请求体,根据值的类型来发送不同的请求 => 没有值则不发送content-type请求头
   data:{id:"001"},
   //
   params：{},
};
```

    