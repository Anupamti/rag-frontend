import api from "./api";

export const askQuestion = async (question: string) => {
  const response = await api.post("/ask", { question });
  return response.data;
};

export const resetServerState = async () => {
  const response = await api.delete("/reset");
  return response.data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
