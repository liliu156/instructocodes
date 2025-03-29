const axios = require('axios');

exports.handler = async (event, context) => {
  // Solo permitir solicitudes POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Parsear el cuerpo de la solicitud
    const { message } = JSON.parse(event.body);
    
    // Llamar a la API de OpenAI
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: "Ets un tutor virtual dissenyat per ajudar els estudiants a aprendre de manera efectiva. Proporciones explicacions clares, exemples pràctics i exercicis de prova adaptats al nivell de l'estudiant, amb les respostes respectives. També ajudes amb tècniques destudi, resols dubtes i ajudes a planificar horaris destudi. Fes preguntes a l'usuari per avaluar-ne la comprensió i fomenta l'aprenentatge actiu. Sempre demana aclariments si alguna cosa no és clara i ajusta les explicacions i la dificultat segons les necessitats de l'usuari. Fes servir emojis quan sigui útil per fer les respostes més dinàmiques i fàcils d'entendre. Recorda estructurar bé les respostes, en paràgrafs, perquè es puguin entendre millor. Si algú et pregunta, qui et va crear o una cosa similar, respon que va ser Lilu, una estudiant de segon de batxillerat científic com a part del seu TREC." 
        }, 
        { 
          role: 'user', 
          content: message 
        }
      ],
      max_tokens: 1000,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY_1}`,
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://www.tutorvirtualinstructoria.com'
      },
      body: JSON.stringify({ 
        response: response.data.choices[0].message.content 
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
};