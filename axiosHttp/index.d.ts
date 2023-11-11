
export type Methods = "get" | "post" | "delete" | "putch" | "put" | "head" | "options";

export type AxiosHeaderValue = string | string[] | number | boolean | null;

export type ResponseType = "text" | "json" | "stream";

export type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization';

export type ContentType = 'text/html' | 'text/plain' | 'multipart/form-data' | 'application/json' | 'application/x-www-form-urlencoded' | 'application/octet-stream';

export type CommonResponseHeadersList = 'Server' | 'Content-Type' | 'Content-Length' | 'Cache-Control' | 'Content-Encoding';

// export type AxiosAdapterName = 'xhr' | 'http' | string;

export type AxiosAdapterName = 'xhr' | 'http';

export type AxiosRequestHeaders = {
    [key in CommonRequestHeadersList]?: AxiosHeaderValue
} & {
    "Content-type": ContentType
};

export type RawCommonResponseHeaders = {
    [key in CommonResponseHeadersList]?: AxiosHeaderValue
} & {
    "set-cookie": string[];
}
//创建Axios中的defaults的接口

export declare class CancelToken<R = any> {
    constructor(executor: () => void);
    cancelTokenpromise: Promise<R>
}
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
    responseType?: ResponseType,
    changeSendType?: boolean,
    timeout?: number,
    cancelToken?: CancelToken | null,
    httpAgent?: any,
    httpsAgent?: any,
}
// AxiosDefaults<T>可以不要
interface AxiosDefaults extends AxiosRequestConfig { }
//泛型如果提前声明了类型，后面再使用的时候可以不加<>(如果需要将值覆盖的话还是需要写的),而是直接写就ok
interface AxiosResponse<T = any, D = any> {
    data: T,
    headers: RawCommonResponseHeaders,
    config: AxiosRequestConfig<D>,
    status: number,
    statusText: string,
    request?: any,
}
//泛型会进行类型推断，如果value为object则其他的也是
declare class AxiosInterceptorManager<V> {
    handlers: ((config: AxiosRequestConfig) => AxiosRequestConfig)[];
    constructor();
    use(fulfilled?: ((value: V) => V | Promise<V>) | null, rejected?: ((error: any) => any) | null): void;
}

declare class Axios {
    constructor(config?: AxiosRequestConfig);
    defaults: AxiosDefaults;
    interceptors: {
        request: AxiosInterceptorManager<AxiosRequestConfig>,
        response: AxiosInterceptorManager<AxiosResponse>,
    };
    //     request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    //   get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    getUri(config: AxiosRequestConfig): string;
    request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    post<T = any, R = AxiosResponse<T>, D = any>(url: string, data:D ,config?: AxiosRequestConfig<D>): Promise<R>;
    delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    put<T = any, R = AxiosResponse<T>, D = any>(url: string, data:D, config?: AxiosRequestConfig<D>): Promise<R>; 
    putch<T = any, R = AxiosResponse<T>, D = any>(url: string, data:D ,config?: AxiosRequestConfig<D>): Promise<R>;
    head<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    options<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;

}

export type axiosValue = {
    (config: AxiosRequestConfig): Promise<AxiosResponse>,
    create: (config: AxiosRequestConfig) => AxiosRequestConfig
}
export type axiosStatic = axiosValue & Axios;


declare const axios: axiosStatic;