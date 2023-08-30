//取消请求功能,参数为一个函数
/*
    取消请求是通过判断config参数是否拥有cancelToken属性
    再通过promise来判断是否取消请求
*/
function CancelToken(executor) {
    let resolvePromise;

    this.cancelTokenpromise = new Promise((resolve, reject) => {
        //将改变状态的使用权给到resolvePromise
        resolvePromise = resolve;
    });
    //如果函数调用，则promise的状态改变，然后取消请求
    executor(function () {
        // 将函数暴漏
        resolvePromise();
    })
};
module.exports = {CancelToken};