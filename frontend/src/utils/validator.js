export const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&\n?#]+)/;
    return youtubeRegex.test(url);
  };

  export const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  export const validateYouTubeInput = (url) => {
    if (!url) {
      return { isValid: false, message: "Please enter a YouTube URL" };
    }
    if (!isValidYouTubeUrl(url)) {
      return { isValid: false, message: "Please enter a valid YouTube URL" };
    }
    const videoId = extractVideoId(url);
    if (!videoId) {
      return { isValid: false, message: "Could not extract video ID from URL" };
    }
    return { isValid: true, videoId };
  };

  export const validateTextInput = (text) => {
    if (!text.trim()) {
      return { isValid: false, message: "Please enter some text to fact-check" };
    }
    return { isValid: true };
  };

  export const validateFileInput = (file) => {
    if (!file) {
      return { isValid: false, message: "Please select a file" };
    }
    if (!["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      return { isValid: false, message: "Only PDF, DOCX, or TXT files are supported" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, message: "File size must be less than 5MB" };
    }
    return { isValid: true };
  };