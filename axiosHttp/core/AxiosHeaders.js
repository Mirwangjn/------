const utils = require("../utils");
function normalHeader(_header) {
    //String(xx) => 强制类型转换
    return _header && String(_header).trim().toLowerCase();
};


class AxiosHeaders {
    constructor(header) {
        this.header = header;
    };
    set(key,val){
        const self = this;
        //变为正常的头信息
        const _header = normalHeader(key);

        if(self.header[key]) {
            self.header[key] = val;
            return;
        }

        
    };
};
module.exports = AxiosHeaders;