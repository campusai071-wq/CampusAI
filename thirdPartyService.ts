const getThirdPartyKey = (service: string, task: string) => {
  const keyName = `VITE_${service.toUpperCase()}_API_KEY_${task.toUpperCase()}`;
  
  // Try import.meta.env first (client-side)
  let key = (typeof import.meta !== 'undefined' && (import.meta as any).env?.[keyName]);
  
  // Fallback to process.env (server-side/Vercel)
  if (!key && typeof process !== 'undefined' && process.env) {
    key = (process.env as any)[keyName];
  }
  
  if (!key) {
    console.error(`[DEBUG] Missing key: ${keyName}`);
    throw new Error(`Strict Separation Error: No dedicated ${service} API key configured for task [${task}]. Please add ${keyName} to your environment settings.`);
  }
  console.log(`[DEBUG] Looking for key: ${keyName}, Found: ${!!key}`);
  return key;
};

// Example usage structure for future implementation
export const getTavilyKey = (task: string) => getThirdPartyKey('TAVILY', task);
export const getSerperKey = (task: string) => getThirdPartyKey('SERPER', task);
export const getCohereKey = (task: string) => getThirdPartyKey('COHERE', task);
export const getHuggingFaceKey = (task: string) => getThirdPartyKey('HUGGINGFACE', task);
