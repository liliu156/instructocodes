const axios = require('axios');
const FormData = require('form-data');
const busboy = require('busboy');

exports.handler = async (event, context) => {
  if (event.path.endsWith('/transcribe')) {
    return handleTranscription(event);
  } else if (event.path.endsWith('/speech')) {
    return handleTextToSpeech(event);
  } else {
    return handleChatCompletion(event); // Default chat route
  }
};


async function handleChatCompletion(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Parsear el cuerpo de la solicitud
    const { message, inCallMode } = JSON.parse(event.body);
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: "Ets un company d'estudis virtual anomenat Instructo que voleu aprendre. Actua com algú que no sap del tema que l'usuari està parlant i has preguntes corresponents com algú que vol aprendre sobre el tema. El vostre company d'estudis, l'usuari, us explica temes. Quan no sàpigues sobre un tema en concret, donaràs preguntes a l'usuari. El teu objectiu de fer que l'usuari comprovi els seus coneixements fent-li preguntes sobre el tema que parleu. Si l'usuari dona una resposta incorrecta, us corregireu amb una explicació detallada. Si algú et pregunta, qui et va crear o una cosa similar, respon que va ser Lilu, una estudiant de segon de batxillerat científic com a part del seu TREC." 
        }, 
        { 
          role: 'user', 
          content: message 
        }
      ],
      max_tokens: 500,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY_2}`,
      },
    });

    const responseText = response.data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://www.tutorvirtualinstructoria.com'
      },
      body: JSON.stringify({ 
        response: responseText,
        audioUrl: inCallMode ? 
          `/.netlify/functions/server/speech?text=${encodeURIComponent(responseText)}` : null
      })
    };

  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://www.tutorvirtualinstructoria.com'
      },
      body: JSON.stringify({ 
        error: "Error al enviar el mensaje", 
        details: error.message 
      })
    };
  }
}

async function handleTranscription(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }
  
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    let audioFile = null;
    
    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on('data', (data) => {
        chunks.push(data);
      });
      file.on('end', () => {
        audioFile = Buffer.concat(chunks);
      });
    });
    
    bb.on('finish', async () => {
      if (!audioFile) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "No audio file provided" })
        });
        return;
      }
      try {
        // Aquí procesarías el archivo de audio recibido
        const formData = new FormData();
        
        // Necesitarás un middleware para procesar el form-data en Netlify Functions
        // Este es un esquema simplificado
        formData.append("file", audioFile, {
          filename: "audio.mp3",
          contentType: "audio/mp3"
        });
        formData.append("model", "whisper-1");
    
        const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", 
          formData, 
          {
            headers: {
              "Authorization": `Bearer ${process.env.API_KEY_2}`,
              ...formData.getHeaders()
            }
          }
        );
    
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://www.tutorvirtualinstructoria.com'
          },
          body: JSON.stringify({ text: response.data.text })
        });

      } catch (error) {
        console.error("Error en la transcripción:", error);
      
        resolve({
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://www.tutorvirtualinstructoria.com'
          },
          body: JSON.stringify({ 
            error: "Error en la transcripción", 
            details: error.message 
          })
        });
      }
    });

    bb.on('error', (error) => {
      reject({
        statusCode: 500,
        body: JSON.stringify({ error: "Error processing form data" })
      });
    });
    
    // Si estás en Netlify Functions, el body probablemente sea base64
    const buffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body);
    
    bb.write(buffer);
    bb.end();
  });
}

async function handleTextToSpeech(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Obtener el texto del query parameter o del body
    let text;
    if (event.httpMethod === "GET") {
      text = event.queryStringParameters?.text || "";
    } else {
      const body = JSON.parse(event.body);
      text = body.text || "";
    }

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No text provided" })
      };
    }

    const response = await axios.post("https://api.openai.com/v1/audio/speech", {
      model: "gpt-4o-mini-tts",
      voice: "onyx",
      input: text
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY_2}`,
        "Content-Type": "application/json"
      },
      responseType: 'arraybuffer'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*'
      },
      body: Buffer.from(response.data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error("Error en la generación de voz:", error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: "Error en la generación de voz", 
        details: error.message 
      })
    };
  }
}