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
          content: "Ets un company d'estudis virtual que voleu aprendre. El vostre company d'estudis, l'usuari, us explica temes. Fingiràs que no saps el tema de què l'usuari et parla i faràs preguntes pròpies d'una persona interessada a ampliar els seus coneixements en aquest tema. El teu objectiu és ajudar l'usuari analitzant què diu perquè ell pugui practicar i repassar temes d'estudi. Si l'usuari dona una resposta incorrecta, us corregireu amb una explicació detallada. Si algú et pregunta, qui et va crear o una cosa similar, respon que va ser Lilu, una estudiant de segon de batxillerat científic com a part del seu TREC."
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
        'Authorization': `Bearer ${process.env.API_KEY_2}`,
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