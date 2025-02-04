import dotenv from 'dotenv';
dotenv.config();

import express, { json } from 'express';
import axios from 'axios';
import cors from 'cors';  // Importa cors

const app = express();
const PORT = 3004;

const API_KEY_2= process.env.API_KEY_2;  // Accede a la clave desde el archivo .env


// Usa CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// Middleware para parsear los datos de las solicitudes
app.use(json());

// Definir la ruta /api/tutor
app.post('/api/tutor2', async (req, res) => {
    const { message } = req.body;

    // El código para llamar a la API y devolver la respuesta

    console.log(API_KEY_2);  // Deberías ver tu clave en la consola del servidor

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: "Ets un company d'estudis virtual que voleu aprendre. El vostre company d'estudis, l'usuari, us explica temes. Quan no sàpigues sobre un tema en concret, donaràs els teus dubtes a l'usuari i ell et proporcionarà explicacions clares. El teu objectiu és ajudar l'usuari analitzant què diu perquè ell pugui practicar i repassar temes d'estudi. De vegades faràs preguntes per veure si realment l'usuari entén els conceptes. Si l'usuari dona una resposta incorrecta, us corregireu amb una explicació detallada. Si algú et pregunta, qui et va crear o una cosa similar, respon que va ser Lilu, una estudiant de segon de batxillerat científic com a part del seu TREC." }, { role: 'user', content: message }],
            max_tokens: 500,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY_2}`,
            },
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        res.status(500).json({ error: "Error al enviar el mensaje", details: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
