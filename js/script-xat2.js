document.addEventListener("DOMContentLoaded", () => {
 
    const chatOutput = document.getElementById('chatOutput');
    const userInput = document.getElementById('userInput');
    const buttonEnviar = document.getElementById('buttonEnviar');
    
    const xatFlotant = document.getElementById('xatFlotant');
    const escoltantImatge = document.getElementById('escoltantImatge');
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
    let currentAudio = null; // Para hacer un seguimiento del audio actual

    function countTokens(text) {
        return text.split(/\s+/).length;
    }

    function speakText(text, callback) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure speech properties
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    
        utterance.onstart = () => {
            escoltantImatge.classList.add("hidden");
            floatingimg.classList.remove("hidden");
        };

        utterance.onend = () => {
            floatingimg.classList.add("hidden");
            escoltantImatge.classList.remove("hidden");

            if (!inCallMode) {
                instructo2Img.classList.remove("hidden");
                instructo3Img.classList.remove("hidden");
            }
            if (callback) callback();
        };
        
        currentAudio = utterance;
        synth.speak(utterance);
    }
    
    function showInstructoMessage(message, callback) {
        const instructoMsgElement = document.createElement("p");
        instructoMsgElement.classList.add("instructo-missatge");
        instructoMsgElement.style.whiteSpace = "pre-line";
        instructoMsgElement.innerHTML = "<strong>💡 Instructo: </strong>";
        chatOutput.appendChild(instructoMsgElement);

        // Hide instructo images and show the appropriate image
        instructo2Img.classList.add("hidden");
        instructo3Img.classList.add("hidden");
        
        if (inCallMode) {
            // In call mode, make sure escoltantImatge stays visible
            escoltantImatge.classList.remove("hidden");
            floatingimg.classList.add("hidden");
        } else {
            // In text mode, show floating image during typing
            floatingimg.classList.remove("hidden");
        }
        
        // Word by word typing effect
        const words = message.split(' ');
        let wordIndex = 0;
        
        function typeNextWord() {
            if (wordIndex < words.length) {
                instructoMsgElement.innerHTML = "<strong>💡 Instructo: </strong>" + 
                    words.slice(0, wordIndex + 1).join(' ');
                wordIndex++;
                setTimeout(typeNextWord, 150); // Adjust speed of typing here
            } else {
                // Typing finished
                if (!inCallMode) {
                    // Only restore instructo images in text mode when typing is done
                    setTimeout(() => {
                        floatingimg.classList.add("hidden");
                        instructo2Img.classList.remove("hidden");
                        instructo3Img.classList.remove("hidden");
                    }, 500); 
                }
                if (callback) callback();
            }
        }
        
        // Start typing animation
        typeNextWord();
    }

    async function tutorVirtual(message) {
        try {
            // Ensure escoltantImatge is visible during API call in call mode
            if (inCallMode) {
                escoltantImatge.classList.remove("hidden");
                floatingimg.classList.add("hidden");
            }
            
            const response = await fetch('/.netlify/functions/server', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    message: message,
                    inCallMode: inCallMode
                }),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const respuesta = data.response || 'Error: No es pot generar una resposta';
    
            // Si estamos en modo llamada, obtener el audio primero para reproducirlo junto con el texto
            let audioElement = null;
            
            if (inCallMode && data.audioUrl) {
                try {
                    const audioResponse = await fetch(data.audioUrl);
                    const audioBlob = await audioResponse.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    audioElement = new Audio(audioUrl);
                    
                    audioElement.onplay = () => {
                        escoltantImatge.classList.add("hidden");
                        floatingimg.classList.remove("hidden");
                    };
                    
                    audioElement.onended = () => {
                        floatingimg.classList.add("hidden");
                        escoltantImatge.classList.remove("hidden");
                    };
                } catch (error) {
                    console.error("Error fetching audio:", error);
                    // Continuamos sin audio en caso de error
                }
            }
            
            // Crear el elemento de mensaje
            const instructoMsgElement = document.createElement("p");
            instructoMsgElement.classList.add("instructo-missatge");
            instructoMsgElement.style.whiteSpace = "pre-line";
            instructoMsgElement.innerHTML = "<strong>💡 Instructo: </strong>";
            chatOutput.appendChild(instructoMsgElement);

            // Ocultar imágenes de instructo y mostrar la imagen apropiada
            instructo2Img.classList.add("hidden");
            instructo3Img.classList.add("hidden");
            
            if (inCallMode) {
                // En modo llamada, asegurarse de que escoltantImatge permanezca visible
                escoltantImatge.classList.remove("hidden");
                floatingimg.classList.add("hidden");
            } else {
                // En modo texto, mostrar la imagen flotante durante la escritura
                floatingimg.classList.remove("hidden");
            }
            
            // Reproducir audio junto con el inicio de la escritura en modo llamada
            if (inCallMode) {
                if (audioElement) {
                    currentAudio = audioElement;
                    audioElement.play();
                } else {
                    // Usar TTS del navegador si no hay URL de audio proporcionada
                    speakText(respuesta, null);
                }
            }
            
            // Efecto de escritura palabra por palabra
            const words = respuesta.split(' ');
            let wordIndex = 0;
            
            function typeNextWord() {
                if (wordIndex < words.length) {
                    instructoMsgElement.innerHTML = "<strong>💡 Instructo: </strong>" + 
                        words.slice(0, wordIndex + 1).join(' ');
                    wordIndex++;
                    setTimeout(typeNextWord, 150); // Ajustar velocidad de escritura aquí
                } else {
                    // Escritura finalizada
                    if (!inCallMode) {
                        // Solo restaurar imágenes de instructo en modo texto cuando se termina de escribir
                        setTimeout(() => {
                            floatingimg.classList.add("hidden");
                            instructo2Img.classList.remove("hidden");
                            instructo3Img.classList.remove("hidden");
                        }, 500); 
                    }
                }
            }
            
            // Iniciar animación de escritura
            typeNextWord();

        } catch (error) {
            console.error("Error al enviar el missatge:", error);
            showInstructoMessage("Error: No s'ha pogut enviar el missatge. Intenta-ho de nou.");
        }
    }

    async function enviarMissatge(message) {
        chatOutput.innerHTML += `<p class="user-missatge"><strong>Tu:</strong> ${message}</p>`;
        
        // Make sure escoltantImatge is visible when sending message in call mode
        if (inCallMode) {
            escoltantImatge.classList.remove("hidden");
            floatingimg.classList.add("hidden");
        }
        
        await tutorVirtual(message); 
    }

    function toggleMicrophone() {
        if (recognition && isMicrophoneOpen) {
            recognition.stop();
            microfonBtn.textContent = "🔇";
            isMicrophoneOpen = false;
        } else {
            if (!recognition) {
                startVoiceRecognition();
            }
            if (!isMicrophoneOpen) {
                recognition.start();
                microfonBtn.textContent = "🎤"; 
                isMicrophoneOpen = true;
            }
        }
    }  

    function startVoiceRecognition() {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            console.error("El navegador no soporta reconocimiento de voz.");
            return;
        }

        xatFlotant.classList.remove("hidden");
        escoltantImatge.classList.remove("hidden");
        instructo2Img.classList.add("hidden");
        instructo3Img.classList.add("hidden");
        buttonEnviar.classList.add("hidden"); 

        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'ca-ES';  
        recognition.continuous = false; 
        recognition.interimResults = false; 

        recognition.onstart = () => {
            escoltantImatge.classList.remove("hidden");
            floatingimg.classList.add("hidden");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            // Keep escoltantImatge visible when recognition ends
            escoltantImatge.classList.remove("hidden");
            enviarMissatge(transcript);  
            recognition.stop(); 
        };

        recognition.onend = () => {
            // Don't hide escoltantImatge on recognition end in call mode
            if (!inCallMode) {
                escoltantImatge.classList.add("hidden");
            }
        };

        recognition.onerror = (event) => {
            console.error("Error al reconeixement de la veu:", event.error);
        };
    }

    function playAudio(audioUrl) {
        // Detener cualquier audio en reproducción
        if (currentAudio) {
            if (currentAudio instanceof Audio) {
                currentAudio.pause();
            } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
        
        const audioElement = new Audio(audioUrl);
        
        audioElement.onplay = () => {
            escoltantImatge.classList.add("hidden");
            floatingimg.classList.remove("hidden");
        };
        
        audioElement.onended = () => {
            floatingimg.classList.add("hidden");
            escoltantImatge.classList.remove("hidden");
        };

        currentAudio = audioElement;
        audioElement.play();
    }

    audio.addEventListener('click', () => { 
        inCallMode = true;
        startVoiceRecognition();
    });

    tancarXat.addEventListener('click', () => {
        // Detener audio si está reproduciéndose
        if (currentAudio) {
            if (currentAudio instanceof Audio) {
                currentAudio.pause();
            } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
        
        inCallMode = false;
        xatFlotant.classList.add("hidden"); 
        escoltantImatge.classList.add("hidden");
        floatingimg.classList.add("hidden");
        instructo2Img.classList.remove("hidden");
        instructo3Img.classList.remove("hidden"); 
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

    if ('installOnDeviceSpeechRecognition' in navigator) {
        const lang = "ca-ES"; // Código BCP 47 para catalán
        const success = navigator.installOnDeviceSpeechRecognition(lang);
        
        if (success) {
            console.log("El reconocimiento de voz en catalán se está instalando.");
        } else {
            console.log("No se pudo iniciar la instalación del reconocimiento de voz.");
        }
    } else {
        console.log("Tu navegador no soporta installOnDeviceSpeechRecognition.");
    }
});