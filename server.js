import dotenv from 'dotenv';
dotenv.config();

import express, { json } from 'express';
import axios from 'axios';
import cors from 'cors';  // Importa cors

const app = express();
const PORT = 3002;

const API_KEY= process.env.API_KEY_1;  // Accede a la clave desde el archivo .env


// Usa CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// Middleware para parsear los datos de las solicitudes
app.use(json());

// Definir la ruta /api/tutor
app.post('/api/tutor', async (req, res) => {
    const { message } = req.body;

    // El código para llamar a la API y devolver la respuesta

    console.log(API_KEY);  // Deberías ver tu clave en la consola del servidor

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: "Ets un tutor virtual dissenyat per ajudar els estudiants a aprendre de manera efectiva. Proporciones explicacions clares, exemples pràctics i exercicis de prova adaptats al nivell de l'estudiant, amb les respostes respectives. També ajudes amb tècniques destudi, resols dubtes i ajudes a planificar horaris destudi. Fes preguntes a l'usuari per avaluar-ne la comprensió i fomenta l'aprenentatge actiu. Sempre demana aclariments si alguna cosa no és clara i ajusta les explicacions i la dificultat segons les necessitats de l'usuari. Fes servir emojis quan sigui útil per fer les respostes més dinàmiques i fàcils d'entendre. Recorda estructurar bé les respostes, en paràgrafs, perquè es puguin entendre millor." }, { role: 'user', content: message }],
            max_tokens: 500,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
        });

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        res.status(500).json({ error: "Error al enviar el mensaje", details: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
