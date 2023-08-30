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
        
    };
};
module.exports = AxiosHeaders;