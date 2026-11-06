export interface ILoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface ISignupWithGmailResponse {
  status: number;
  access_token: string;
  refresh_token: string;
}
