const httpAdepter = require("../Adapters/http");
function dispatchRequest(config) {
    //这一步是用来对数据进行整理
    return httpAdepter(config).then((response) => {
        // //用于处理xx类型的数据，对应功能为：responseType
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
        //防止他人瞎乱改，把responseType设置为空字符串
        config.responseType = config.responseType || "json"
            //当以数组形式直接调用函数时，需注意上面地分号
            ;["text", "json"].forEach(key => {
                if (config.responseType === key) {
                    // console.log(handleType[key]);
                    response.data = handleType[key](response);//handleType.json(response)
                }
            });
        return response;
    })
};
module.exports = dispatchRequest;