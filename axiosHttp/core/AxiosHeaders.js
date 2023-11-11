const utils = require("../utils");
function normalHeader(_header) {
    //String(xx) => 强制类型转换
    return _header && String(_header).trim().toLowerCase();
};

//控制他人发送的请求头的方式来为defaults添加请求头
function AxiosHeaders(header) {
    this.header = header;
};
/**
 * 
 * @param {string} key 
 * @param {string} val 
 * @returns 
 */
AxiosHeaders.prototype.set = function(key,val) {
    const self = this;
        //变为正常的头信息
        const _header = normalHeader(key);
        //如果header存在这个响应头就直接重置其值
        if(self.header[key]) {
            self.header[key] = val;
            return;
        }
};
module.exports = AxiosHeaders;