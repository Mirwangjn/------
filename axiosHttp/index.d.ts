
// //声明Methods类型
export type Methods = "get" | "post" | "delete" | "putch" | "put" | "head" | "options";

export type AxiosHeaderValue = string | string[] | number | boolean | null;

export type ResponseType = "text" | "json" | "stream";

export type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization';

export type ContentType = 'text/html' | 'text/plain' | 'multipart/form-data' | 'application/json' | 'application/x-www-form-urlencoded' | 'application/octet-stream';

export type CommonResponseHeadersList = 'Server' | 'Content-Type' | 'Content-Length' | 'Cache-Control' | 'Content-Encoding';

export type AxiosAdapterName = 'xhr' | 'http' | string;

export type AxiosRequestHeaders = {
    [key in CommonRequestHeadersList]?: AxiosHeaderValue
} & {
    "Content-type": ContentType
};

type RawCommonResponseHeaders = {
    [key in CommonResponseHeadersList]?: AxiosHeaderValue
} & {
    "set-cookie": string[];
}
//创建Axios中的defaults的接口

declare export class CancelToken<R> {
    constructor(executor);
    cancelTokenpromise: Promise<R>
};
//声明文件中的泛型在其他地方使用时需要带上
interface AxiosRequestConfig<D = any> {
    adapter?: AxiosAdapterName[],
    url?: string,
    baseURL?: string,
    method?: Methods,
    data?: D,
    //如果params通过识别为object的话，则params也必须是object就不好
    params?: any,
    headers?: AxiosRequestHeaders,
    responseType: ResponseType,
    changeSendType: boolean,
    timeout: number,
    cancelToken: CancelToken | null
};
// AxiosDefaults<T>可以不要
interface AxiosDefaults<T = any> extends AxiosRequestConfig { };
//泛型如果提前声明了类型，后面再使用的时候可以不加<>,而是直接写就ok
interface AxiosResponse<T = any> {
    data: T,
    headers: RawCommonResponseHeaders,
    config: AxiosRequestConfig<T>
    status: number,
    statusText: string,
    request?: any,
};
//泛型会进行类型推断，如果value为object则其他的也是
declare class AxiosInterceptorManager<V> {
    handlers: Function[];
    constructor();
    use(fulfilled?: ((value: V) => V | Promise<V>) | null, rejected?: ((error: any) => any) | null);
};

declare class Axios {
    constructor(config?: AxiosRequestConfig);
    defaults: AxiosDefaults;
    interceptors: {
        request: AxiosInterceptorManager<V>,//v暂时没有值，后续再添加
        response: AxiosInterceptorManager<V>,
    };
    //     request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    //   get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    getUri(config: AxiosRequestConfig): string;
    request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    post<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    put<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    putch<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    head<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    options<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;

}
// declare function forEach<T extends {length: number}>(ele: T,fn:(key: any,val: any) => void,obj?: {allOwnKey:boolean})
// declare export function axios(config: AxiosRequestConfig): Promise<any>
type axiosValue = {
    (config: AxiosRequestConfig): Promise<AxiosResponse>,
    create: (config: AxiosRequestConfig) => AxiosRequestConfig
}
type axiosStatic = axiosValue & Axios

declare const axios: axiosStatic