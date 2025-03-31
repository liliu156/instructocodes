const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());

// Configurar CORS para permitir solo desde tu dominio
const allowedOrigins = ["https://www.tutorvirtualinstructoria.com"];
app.use(cors({
  origin: allowedOrigins,
  methods: ["POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Endpoint para manejar el chat y TTS
app.post("/chat", async (req, res) => {
  try {
    const { message, inCallMode } = req.body;

    // Solicitud al modelo de chat
    const chatRequest = axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Ets un tutor virtual que ajuda als estudiants a comprendre els temes d'estudi..." },
        { role: "user", content: message }
      ],
      max_tokens: 500
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY_1}`,
        "Content-Type": "application/json"
      }
    });

    let response, audioUrl;
    
    if (inCallMode) {
      // Ejecutar Chat y TTS en paralelo
      const [chatResponse, ttsResponse] = await Promise.all([
        chatRequest,
        axios.post("https://api.openai.com/v1/audio/speech", {
          model: "gpt-4o-mini-tts",
          voice: "onyx",
          input: message
        }, {
          headers: {
            "Authorization": `Bearer ${process.env.API_KEY_1}`,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        })
      ]);

      response = chatResponse.data.choices[0].message.content;
      audioUrl = `data:audio/mpeg;base64,${Buffer.from(ttsResponse.data).toString("base64")}`;
    } else {
      // Solo obtener respuesta de chat
      const chatResponse = await chatRequest;
      response = chatResponse.data.choices[0].message.content;
      audioUrl = null;
    }

    res.json({ response, audioUrl });

  } catch (error) {
    console.error("Error en chat/TTS:", error);
    res.status(500).json({ error: "Error en el procesamiento", details: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});