
//实现拦截器
function InterceptorManager() {
    this.handlers = [];
}
InterceptorManager.prototype.use = function (fulfilled, rejected) {
    //use的作用是将参数添加到handlers身上，然后遍历添加到chain中，然后在遍历运行chain
    this.handlers.push({
        fulfilled,
        rejected
    })
};
module.exports = InterceptorManager;