// Archivo: functions/server.js
const { OpenAI } = require('openai');
const formidable = require('formidable');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

// Configurar OpenAI con tu clave API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async function(event, context) {
  // Verificar método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Usar formidable para analizar los datos del formulario y archivos
    const { fields, files } = await parseFormData(event);
    const message = fields.message;
    const inCallMode = fields.inCallMode === 'true';
    const file = files.file ? files.file[0] : null;

    let responseData = {
      response: '',
      audioUrl: null
    };

    // Procesar el mensaje (y el archivo si existe)
    if (file) {
      // Si hay un archivo, procesarlo y enviarlo a OpenAI
      const pdfData = await readFile(file.filepath);
      const base64String = pdfData.toString('base64');
      
      // Crear solicitud para OpenAI con el archivo
      const response = await openai.responses.create({
        model: "gpt-4o", // O el modelo que soporte PDF como entrada
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                filename: file.originalFilename,
                file_data: `data:application/pdf;base64,${base64String}`,
              },
              {
                type: "input_text",
                text: message,
              },
            ],
          },
        ],
      });
      
      responseData.response = response.output_text;
    } else {
      // Procesar solo el mensaje sin archivo
      const response = await openai.responses.create({
        model: "gpt-4o", // O el modelo que prefieras usar
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: message,
              },
            ],
          },
        ],
      });
      
      responseData.response = response.output_text;
    }

    // Si estamos en modo llamada, generar audio
    if (inCallMode) {
      try {
        const audioResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: responseData.response
        });
        
        // Guardar el archivo de audio temporalmente (alternativa: devolver el Buffer como Base64)
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const audioPath = `/tmp/response-${Date.now()}.mp3`;
        fs.writeFileSync(audioPath, audioBuffer);
        
        // Crear una URL firmada o usar algún método para servir el archivo
        // Esto dependerá de tu configuración específica
        responseData.audioUrl = `https://tu-servidor.com/audios/${audioPath.split('/').pop()}`;
      } catch (error) {
        console.error("Error al generar audio:", error);
        // Continúa sin audio en caso de error
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
    const form = formidable({ 
      multiples: true,
      uploadDir: '/tmp',
      keepExtensions: true
    });
    
    form.parse(event.body, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}