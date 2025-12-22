import "axios";

declare module "axios" {
  export interface AxiosRequestHeaders {
    skipAuthRedirect?: string;
  }
}
