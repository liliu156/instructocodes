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

    // Nuevos elementos para carga de archivos
    const fileUploadBtn = document.createElement('button');
    fileUploadBtn.id = 'fileUploadBtn';
    fileUploadBtn.innerHTML = '📎';
    fileUploadBtn.title = 'Subir archivo PDF';
    fileUploadBtn.className = 'upload-btn';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'fileInput';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    
    // Añadir los nuevos elementos al DOM
    const inputContainer = userInput.parentElement;
    inputContainer.appendChild(fileUploadBtn);
    inputContainer.appendChild(fileInput);
    
    // Añadir estilos CSS para el botón de carga
    const style = document.createElement('style');
    style.textContent = `
        .upload-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            margin-left: 5px;
        }
        .upload-btn:hover {
            background-color: rgba(0,0,0,0.1);
            border-radius: 50%;
        }
        .file-preview {
            margin: 10px 0;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
            display: flex;
            align-items: center;
        }
        .file-preview-icon {
            margin-right: 10px;
            font-size: 1.5rem;
        }
        .file-preview-info {
            flex-grow: 1;
        }
        .file-preview-name {
            font-weight: bold;
        }
        .file-preview-size {
            font-size: 0.8rem;
            color: #666;
        }
        .file-preview-remove {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #666;
        }
    `;
    document.head.appendChild(style);

    instructo2Img.classList.remove("hidden");
    instructo3Img.classList.remove("hidden");
    floatingimg.classList.add("hidden");

    let inCallMode = false; 
    let recognition; 
    let isMicrophoneOpen = false;
    let currentAudio = null;
    let currentFile = null;

    function countTokens(text) {
        return text.split(/\s+/).length;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
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

    async function tutorVirtual(message, file = null) {
        try {
            // Ensure escoltantImatge is visible during API call in call mode
            if (inCallMode) {
                escoltantImatge.classList.remove("hidden");
                floatingimg.classList.add("hidden");
            }
            
            // Crear FormData para enviar el mensaje y el archivo
            const formData = new FormData();
            formData.append('message', message);
            formData.append('inCallMode', inCallMode);
            
            // Si hay un archivo para analizar, añadirlo a la solicitud
            if (file) {
                formData.append('file', file);
            }
            
            // Usar fetch con FormData para enviar archivos
            const response = await fetch('/.netlify/functions/server', {
                method: 'POST',
                body: formData,
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

    async function enviarMissatge(message, file = null) {
        // Si hay un archivo, mostrar mensaje con vista previa
        if (file) {
            const filePreviewMsg = `<p class="user-missatge">
                <strong>Tu:</strong> ${message}
                <div class="file-preview">
                    <div class="file-preview-icon">📄</div>
                    <div class="file-preview-info">
                        <div class="file-preview-name">${file.name}</div>
                        <div class="file-preview-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
            </p>`;
            chatOutput.innerHTML += filePreviewMsg;
        } else {
            chatOutput.innerHTML += `<p class="user-missatge"><strong>Tu:</strong> ${message}</p>`;
        }
        
        // Make sure escoltantImatge is visible when sending message in call mode
        if (inCallMode) {
            escoltantImatge.classList.remove("hidden");
            floatingimg.classList.add("hidden");
        }
        
        await tutorVirtual(message, file); 
    }

    // Funciones para manejo de archivos
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar el tipo de archivo (PDF)
        if (file.type !== 'application/pdf') {
            alert('Por favor, sube solo archivos PDF.');
            fileInput.value = '';
            return;
        }
        
        // Validar el tamaño del archivo (máximo 32MB según las restricciones de OpenAI)
        if (file.size > 32 * 1024 * 1024) {
            alert('El archivo es demasiado grande. El tamaño máximo permitido es de 32MB.');
            fileInput.value = '';
            return;
        }
        
        // Guardar el archivo en una variable para usarlo en el envío del mensaje
        currentFile = file;
        
        // Mostrar un mensaje indicando que se ha seleccionado un archivo
        userInput.placeholder = `Archivo seleccionado: ${file.name}. Escribe tu pregunta sobre este documento...`;
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

    // Manejar la selección de archivos
    fileUploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileUpload);

    buttonEnviar.addEventListener('click', () => {
        if (!inCallMode) {
            const input = userInput.value.trim();
            if (!input) {
                alert("Por favor, escribe un mensaje.");
                return;
            }
            const fileToSend = currentFile;
            currentFile = null; // Resetear después de enviarlo
            userInput.placeholder = "Escribe tu mensaje...";
            userInput.value = '';
            enviarMissatge(input, fileToSend);
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
            const fileToSend = currentFile;
            currentFile = null; // Resetear después de enviarlo
            userInput.placeholder = "Escribe tu mensaje...";
            userInput.value = '';
            enviarMissatge(input, fileToSend);
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