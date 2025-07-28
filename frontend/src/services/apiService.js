const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleResponse = async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.detail || error.message || "API request failed");
    }
    return response.json();
  };

  export const processYouTubeUrl = async (url) => {
    const response = await fetch(`${API_BASE_URL}/youtube`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return handleResponse(response);
  };

  export const processTextInput = async (text) => {
    const response = await fetch(`${API_BASE_URL}/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return handleResponse(response);
  };

  export const processFileInput = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/file`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(response);
  };