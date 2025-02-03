document.addEventListener("DOMContentLoaded", () => {
 
    const chatOutput = document.getElementById('chatOutput');
    const userInput = document.getElementById('userInput');
    const buttonEnviar = document.getElementById('buttonEnviar');
    
    const xatFlotant = document.getElementById('xatFlotant');
    const escoltantImatge = document.getElementById('escoltantImatge');
    const parlantImatge = document.getElementById('parlantImatge');
    const indicadorEscoltant = document.getElementById('indicadorEscoltant');
    const audio = document.getElementById('audio');
    const tancarXat = document.getElementById('tancarXat');
    const instructo3Img = document.getElementById('instructo3-img');
    const instructo2Img = document.getElementById('instructo2-img');
    const floatingimg = document.getElementById('floating-img');
    const microfonBtn = document.getElementById('microfonBtn'); 

    instructo2Img.classList.remove("hidden");
    instructo3Img.classList.remove("hidden");
    floatingimg.classList.add("hidden");


    let inCallMode = false; 
    let recognition; 
    let isMicrophoneOpen = false;

    function countTokens(text) {
        return text.split(/\s+/).length;
    }

    function showInstructoMessage(message, callback) {
        const instructoMsgElement = document.createElement("p");
        instructoMsgElement.classList.add("instructo-missatge");
        instructoMsgElement.style.whiteSpace = "pre-line";
        instructoMsgElement.innerHTML = "<strong>💡 Instructo: </strong>"; 
        chatOutput.appendChild(instructoMsgElement);

        instructo2Img.classList.add("hidden");
        instructo3Img.classList.add("hidden");
        floatingimg.classList.remove("hidden");

        let i = 0;
        const interval = setInterval(() => {
            instructoMsgElement.innerHTML += message[i];
            chatOutput.scrollTop = chatOutput.scrollHeight;

            if (i === message.length - 1) {
                clearInterval(interval);
                if (!inCallMode) {
                    instructo2Img.classList.remove("hidden");
                    instructo3Img.classList.remove("hidden");
                    floatingimg.classList.add("hidden");
                }
                if (callback) callback();
            }
            i++;
        }, 50);

        if (inCallMode) { 
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(message);

            parlantImatge.classList.remove("hidden");
            escoltantImatge.classList.add("hidden");
            floatingimg.classList.add("hidden");

            utterance.onend = () => {
                parlantImatge.classList.add("hidden");
                escoltantImatge.classList.remove("hidden");
                floatingimg.classList.add("hidden");
                if (callback) callback();
            };

            synth.speak(utterance);
        }
    }

    async function searchWeb(query) {
        const searchUrl = `https://api.duckduckgo.com/?q=${query}&format=json`;
        try {
            const response = await fetch(searchUrl);
            if (!response.ok) {
                throw new Error(`Error en la búsqueda: ${response.statusText}`);
            }
            const data = await response.json();
            const links = data.RelatedTopics?.map(topic => topic.FirstURL).filter(url => url) || [];
            return links.slice(0, 3); 
        } catch (error) {
            console.error("Error al buscar en la web:", error);
            return [];
        }
    }

    async function tutorVirtual(message) {
        try {
            const response = await fetch('http://localhost:3002/api/tutor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });
    
            const data = await response.json();
            const respuesta = data.response || 'Error: No es pot generar una resposta';
    
            if (respuesta.toLowerCase().includes("buscar") || respuesta.toLowerCase().includes("enllaços")) {
                const enlaces = await searchWeb(respuesta);
                if (enlaces.length > 0) {
                    showInstructoMessage(`Aquí tens alguns enllaços que et poden ajudar:\n${enlaces.join("\n")}`);
                } else {
                    showInstructoMessage("No s'han trobat enllaços rellevants.");
                }
            } else {
                showInstructoMessage(respuesta);
            }
        } catch (error) {
            console.error("Error al enviar el missatge:", error);
            showInstructoMessage("Error: No s'ha pogut enviar el missatge. Intenta-ho de nou.");
        }
    }

    async function enviarMissatge(message) {
        chatOutput.innerHTML += `<p class="user-missatge"><strong>Tu:</strong> ${message}</p>`;
        await tutorVirtual(message); 
    }

    function toggleMicrophone() {
        if (!isMicrophoneOpen) {
            recognition.start();
            microfonBtn.textContent = "🎤"; 
            isMicrophoneOpen = true;
        } else {
            recognition.stop();
            microfonBtn.textContent = "🔇";
            isMicrophoneOpen = false;
        }
    }

    function startVoiceRecognition() {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            console.error("El navegador no soporta reconocimiento de voz.");
            return;
        }

        xatFlotant.classList.remove("hidden");
        escoltantImatge.classList.remove("hidden");
        parlantImatge.classList.add("hidden");
        instructo2Img.classList.add("hidden");
        instructo3Img.classList.add("hidden");
        buttonEnviar.classList.add("hidden"); 

        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'ca-ES';  
        recognition.continuous = false; 
        recognition.interimResults = false; 

        recognition.onstart = () => {
            indicadorEscoltant.classList.remove("hidden");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            enviarMissatge(transcript);  
            recognition.stop(); 
        };

        recognition.onend = () => {
            indicadorEscoltant.classList.add("hidden");
            escoltantImatge.classList.add("hidden");
        };

        recognition.onerror = (event) => {
            console.error("Error al reconeixement de la veu:", event.error);
        };
    }

    audio.addEventListener('click', () => { 
        inCallMode = true;
        startVoiceRecognition();
    });

    tancarXat.addEventListener('click', () => {
        xatFlotant.classList.add("hidden");
        inCallMode = false;
        instructo2Img.classList.remove("hidden");
        instructo3Img.classList.remove("hidden"); 
        escoltantImatge.classList.add("hidden");
        parlantImatge.classList.add("hidden");
        buttonEnviar.classList.remove("hidden"); 
    });

    microfonBtn.addEventListener('click', toggleMicrophone);

    buttonEnviar.addEventListener('click', () => {
        if (!inCallMode) {
            const input = userInput.value.trim();
            if (!input) {
                alert("Por favor, escribe un mensaje.");
                return;
            }
            userInput.value = '';
            enviarMissatge(input);
        }
    });

    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !inCallMode) {
            event.preventDefault();  
            const input = userInput.value.trim();
            if (!input) {
                alert("Por favor, escribe un mensaje.");
                return;
            }
            userInput.value = '';
            enviarMissatge(input);
        }
    });

    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = userInput.scrollHeight + "px";
    });
});
