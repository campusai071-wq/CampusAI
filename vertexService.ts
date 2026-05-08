import { VertexAI } from "@google-cloud/vertexai";

let vertexAI: VertexAI | null = null;

const getVertexAI = () => {
  if (!vertexAI && typeof window === 'undefined') {
    const project = process.env.VITE_GCP_PROJECT_ID;
    const location = process.env.VITE_GCP_LOCATION || 'us-central1';
    if (project) {
      vertexAI = new VertexAI({ project, location });
    }
  }
  return vertexAI;
};

export const getVertexAIInstance = () => {
  const vAI = getVertexAI();
  if (!vAI) return null;

  return {
    models: {
      generateContent: async (params: any) => {
        const model = vAI.getGenerativeModel({ model: params.model || 'gemini-1.5-flash' });
        const result = await model.generateContent({
           contents: params.contents,
           generationConfig: params.config,
           tools: params.config?.tools
        });
        const response = await result.response;
        return {
          text: response.candidates?.[0]?.content?.parts?.[0]?.text || '',
          response: response
        };
      },
      generateContentStream: async function* (params: any) {
        const model = vAI.getGenerativeModel({ model: params.model || 'gemini-1.5-flash' });
        const result = await model.generateContentStream({
          contents: params.contents,
          generationConfig: params.config,
          tools: params.config?.tools
        });
        for await (const chunk of result.stream) {
          yield {
             text: chunk.candidates?.[0]?.content?.parts?.[0]?.text || '',
             candidates: chunk.candidates
          };
        }
      }
    }
  };
};
