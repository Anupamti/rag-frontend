import api from "./api";

export const askQuestion = async (question: string, query_type: string) => {
  const response = await api.post("/ask", { question, query_type });
  return response.data;
};

export const resetServerState = async () => {
  const response = await api.delete("/reset");
  return response.data;
};

export const uploadDoc = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload/document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const uploadTranscript = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload/transcript", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
