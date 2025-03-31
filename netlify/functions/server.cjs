// Archivo: functions/server.js
const { OpenAI } = require('openai');
const formidable = require('formidable');
const fs = require('fs');
const util = require('util');
const pdfParse = require('pdf-parse');

const readFile = util.promisify(fs.readFile);

// Configurar OpenAI con tu clave API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_1
});

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const { fields, files } = await parseFormData(event);
    const message = fields.message;
    const inCallMode = fields.inCallMode === 'true';
    const file = files.file ? files.file[0] : null;

    let responseData = { response: '', audioBase64: null };

    if (file) {
      // Leer el PDF y extraer el texto
      const pdfData = await readFile(file.filepath);
      const pdfText = (await pdfParse(pdfData)).text;

      // Enviar el contenido extraído y el mensaje a OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Eres un asistente útil que analiza documentos PDF." },
          { role: "user", content: `Este es el texto del documento:\n${pdfText}\n\nPregunta del usuario: ${message}` }
        ]
      });

      responseData.response = response.choices[0].message.content;
    } else {
      // Procesar solo el mensaje sin archivo
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Eres un asistente útil." },
          { role: "user", content: message }
        ]
      });

      responseData.response = response.choices[0].message.content;
    }

    // Si estamos en modo llamada, generar audio en Base64
    if (inCallMode) {
      try {
        const audioResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: responseData.response
        });

        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        responseData.audioBase64 = audioBuffer.toString("base64");
      } catch (error) {
        console.error("Error al generar audio:", error);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error("Error en el servidor:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

// Función para analizar los datos del formulario
function parseFormData(event) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, uploadDir: '/tmp', keepExtensions: true });

    // Convertir el body en Buffer si es necesario
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

    form.parse(bodyBuffer, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}
