declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TZ: "UTC";
      NODE_ENV: NodeJS.ProcessEnv;
    }
  }
}
export {};
