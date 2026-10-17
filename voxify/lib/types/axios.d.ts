// Ambient type declarations for axios in case local node_modules has not run npm install yet
// (Vercel builds will install and use official axios definitions)

declare module 'axios' {
  export interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: Record<string, any>;
    params?: any;
    data?: any;
    timeout?: number;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    maxContentLength?: number;
    maxBodyLength?: number;
    validateStatus?: (status: number) => boolean;
    [key: string]: any;
  }

  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, any>;
    config: AxiosRequestConfig;
    request?: any;
  }

  export interface AxiosError<T = any> extends Error {
    config: AxiosRequestConfig;
    code?: string;
    request?: any;
    response?: AxiosResponse<T>;
    isAxiosError: boolean;
    toJSON: () => object;
  }

  export interface AxiosInstance {
    (config: AxiosRequestConfig): Promise<AxiosResponse>;
    (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;
    get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    head<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    options<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
    post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    request<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R>;
  }

  export interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance;
    isAxiosError(payload: any): payload is AxiosError;
    all<T>(values: Array<T | Promise<T>>): Promise<T[]>;
    spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  }

  const axios: AxiosStatic;
  export default axios;
}
