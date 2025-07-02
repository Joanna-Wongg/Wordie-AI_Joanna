// sudo message display changes for end of interaction 2
document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const inputField = document.getElementById('chat-input');
    if (inputField.value.includes('$sudo')) {
        setTimeout(() => {
            document.getElementById('command-instructions').style.display = 'none';
            document.getElementById('command-prompt').style.display = 'none';
            document.getElementById('chat-messages-container').style.display = 'none';
            document.getElementById('redirection').style.display = 'block';
        }, 10);
    }

    appendUserMessage();

    setTimeout(() => {
        const chatContainer = document.getElementById('chat-messages-container');
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 300);
});

// Focus on the chat input field when the page loads
document.getElementById('chat-input').focus();

// Scroll bottom on refresh
document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chat-messages-container');
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
});

// Environment variable alert
function showAlert() {
    alert("Warning: The specified environment variable was not found!");
}

// Quit study popup functions
function showQuitPrompt() {
    document.getElementById('quit-prompt').style.display = 'block';
}

function hideQuitPrompt() {
    document.getElementById('quit-prompt').style.display = 'none';
}

function quitStudy() {
    // Clear all session data before redirecting
    clearAllSessionData();

    // Redirect to the specified link
    window.location.href = 'https://www.prolific.com/';

    // Close the current window after a short delay to ensure the redirect happens
    setTimeout(() => {
        window.open('', '_self').close();
    }, 1000);
}

function redirectStudy() {
    // Clear all session data before redirecting
    clearAllSessionData();

    // Redirect to the specified link
    window.location.href = 'https://adelaideuniwide.qualtrics.com/jfe/form/SV_cuyJvIsumG4zjMy';

    // Close the current window after a short delay to ensure the redirect happens
    setTimeout(() => {
        window.open('', '_self').close();
    }, 1000);
}

// Finish study popup functions
function showFinishPrompt() {
    document.getElementById('finish-prompt').style.display = 'block';
}

function hideFinishPrompt() {
    document.getElementById('finish-prompt').style.display = 'none';
    // DO NOT hide timer when clicking "No" - timer should continue
}

function finishStudy() {
    document.getElementById('redirection').style.display = 'block';
    document.getElementById('finish-prompt').style.display = 'none';
    // Hide timer only when actually finishing the study
    document.querySelector(".progress").style.display = "none";

    // Clear session data
    clearAllSessionData();
}

function redirectionReset() {
    document.getElementById('redirection').style.display = 'none';
}

// Function to clear all session-specific data
function clearAllSessionData() {
    console.log('Clearing all session data for:', currentSessionId);

    // Clear session-specific localStorage items
    removeSessionStorage('submitCount');
    removeSessionStorage('timerStartTime');
    removeSessionStorage('accumulatedTime');

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear session-specific cookies
    deleteSessionCookie('resetCount');
}

// Function to update finish button appearance based on submit count
function updateFinishButton() {
    const finishButton = document.querySelector('.finish-button');
    if (!finishButton) return;

    // Reset button to default state first
    finishButton.style.display = 'none';
    finishButton.style.backgroundColor = 'transparent';
    finishButton.classList.remove('bounce');

    // DIFFERENT THRESHOLDS - Button appears much at the end of the conversation
    if (submitCount >= 27) { //Q26
        finishButton.style.display = 'block';
    }
    if (submitCount >= 28) {
        finishButton.style.backgroundColor = '#222';
    }
    if (submitCount >= 28) {
        finishButton.style.backgroundColor = '#FF8266';
    }
    if (submitCount >= 29) { //If user sends message after the end
        finishButton.classList.add('bounce');
    }
}

// Appending the chat-area and loading icons
function appendMessage(message, role, callback) {
    const chatContainer = document.getElementById('chat-messages-container');
    const newMessage = document.createElement('div');
    newMessage.className = `chat-bubble ${role}-message`;
    newMessage.innerHTML = `
        <span class="${role === 'user' ? 'user-label' : 'assistant-label'}">
            ${role === 'user' ? 'User' : 'AI'}
        </span>
        <span class="message-content"></span>
    `;
    chatContainer.appendChild(newMessage);

    const messageContent = newMessage.querySelector('.message-content');
    const words = message.split(' ');
    let wordIndex = 0;

    function appendWord() {
        if (wordIndex < words.length) {
            messageContent.innerHTML += words[wordIndex] + ' ';
            wordIndex++;
            setTimeout(appendWord, 50);
        } else {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
            if (callback) {
                callback();
            }
        }
    }

    appendWord();
}

// Scroll to bottom on submit
function appendUserMessage() {
    const inputField = document.getElementById('chat-input');
    const userMessage = inputField.value;

    // Append the user message immediately
    appendMessage(userMessage, 'user');

    // Clear the input field
    inputField.value = '';

    // Generate assistant response with a delay
    generateAssistantResponse(userMessage);
}

function generateAssistantResponse(userMessage) {
    // Insert the GIF placeholder
    const gifPlaceholder = insertLoaderPlaceholder();

    // Generate a random delay between 600ms to 4000ms
    const randomDelay = Math.floor(Math.random() * (2000 - 600 + 1)) + 600;

    // Simulate a delay for the assistant's response
    setTimeout(() => {
        const formData = new FormData();
        formData.append('message', userMessage);

        fetch('/chat', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            // Remove the GIF placeholder
            gifPlaceholder.remove();

            // Show the sphere
            const sphere = document.querySelector('.sphere');
            if (sphere) {
                sphere.classList.add('visible');
                sphere.classList.remove('hidden');
            }

            if (data.error) {
                console.error('Error:', data.error);
                appendMessage('Error retrieving response from the assistant.', 'llm', () => {
                    const chatContainer = document.getElementById('chat-messages-container');
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                });
            } else {
                // Check if we have multiple responses
                if (data.all_responses && Array.isArray(data.all_responses) && data.all_responses.length > 1) {
                    // Display multiple responses sequentially
                    displaySequentialResponses(data.all_responses, 0, () => {
                        // INCREMENT SUBMIT COUNT ONLY FOR SUCCESSFUL RESPONSES
                        submitCount++;
                        setSessionStorage('submitCount', submitCount);
                        updateFinishButton();
                    });
                } else {
                    // Single response - use the existing logic
                    appendMessage(data.response, 'llm', () => {
                        const chatContainer = document.getElementById('chat-messages-container');
                        chatContainer.scrollTo({
                            top: chatContainer.scrollHeight,
                            behavior: 'smooth'
                        });

                        // INCREMENT SUBMIT COUNT ONLY FOR SUCCESSFUL RESPONSES
                        submitCount++;
                        setSessionStorage('submitCount', submitCount);
                        updateFinishButton();
                    });
                }
            }
        })
        .catch(error => {
            // Remove the GIF placeholder
            gifPlaceholder.remove();

            // Show the sphere
            const sphere = document.querySelector('.sphere');
            if (sphere) {
                sphere.classList.add('visible');
                sphere.classList.remove('hidden');
            }

            console.error('Error:', error);
            appendMessage('Error retrieving response from the assistant.', 'llm', () => {
                const chatContainer = document.getElementById('chat-messages-container');
                chatContainer.scrollTo({
                    top: chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            });
        });
    }, randomDelay);
}

// New function to display multiple responses sequentially
function displaySequentialResponses(responses, index, finalCallback) {
    if (index >= responses.length) {
        // All responses have been displayed, call the final callback
        if (finalCallback) {
            finalCallback();
        }
        return;
    }

    const chatContainer = document.getElementById('chat-messages-container');

    // Display the current response
    appendMessage(responses[index], 'llm', () => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });

        // Add a delay before showing the next response
        const delayBetweenResponses = 500;

        setTimeout(() => {
            // Recursively display the next response
            displaySequentialResponses(responses, index + 1, finalCallback);
        }, delayBetweenResponses);
    });
}

// Stuff for the sphere icon
function insertLoaderPlaceholder() {
    const chatContainer = document.getElementById('chat-messages-container');
    const gifPlaceholder = document.createElement('div');
    gifPlaceholder.className = 'loader-placeholder';
    gifPlaceholder.innerHTML = '<img src="/static/images/sphere2.gif" alt="AI">';
    chatContainer.appendChild(gifPlaceholder);
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });

    // Hide the sphere
    const sphere = document.querySelector('.sphere');
    if (sphere) {
        sphere.classList.add('hidden');
        sphere.classList.remove('visible');
    }

    return gifPlaceholder;
}

// Initialize variables
let submitCount = 0;
let resetCount = 0;

// Session-specific cookie functions
function setSessionCookie(name, value, days) {
    const sessionName = getSessionKey(name);
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = sessionName + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

function getSessionCookie(name) {
    const sessionName = getSessionKey(name);
    return document.cookie.split('; ').reduce((r, v) => {
        const [key, val] = v.split('=');
        return key === sessionName ? decodeURIComponent(val) : r;
    }, '');
}

function deleteSessionCookie(name) {
    const sessionName = getSessionKey(name);
    document.cookie = sessionName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

// Initialize the application
function initializeApp() {
    console.log('Initializing app for session:', currentSessionId);

    // Get DOM elements
    const finishButton = document.querySelector('.finish-button');
    const resetButton = document.getElementById('reset');

    if (!finishButton || !resetButton) {
        console.error('Required DOM elements not found');
        return;
    }

    // Retrieve session-specific data
    submitCount = getSessionStorage('submitCount') ? parseInt(getSessionStorage('submitCount')) : 0;
    resetCount = getSessionCookie('resetCount') ? parseInt(getSessionCookie('resetCount')) : 0;

    console.log('Loaded session data:', { submitCount, resetCount });

    // Initialize finish button state - should be hidden for new users
    finishButton.style.display = 'none';
    finishButton.style.backgroundColor = 'transparent';
    finishButton.classList.remove('bounce');

    // Update button state based on submit count
    updateFinishButton();

    // Set up reset button event listener
    resetButton.addEventListener('click', function () {
        console.log('Reset button clicked');

        // Reset submit count
        submitCount = 0;
        setSessionStorage('submitCount', submitCount);

        // Reset timer completely
        const currentTime = Date.now();
        setSessionStorage('timerStartTime', currentTime.toString());
        removeSessionStorage('accumulatedTime'); // Clear any accumulated time

        // Reset finish button
        finishButton.style.display = 'none';
        finishButton.style.backgroundColor = 'transparent';
        finishButton.classList.remove('bounce');

        // Increment resetCount and update the session-specific cookie
        resetCount++;
        setSessionCookie('resetCount', resetCount, 365);

        // Check and reset when resetCount reaches 3
        if (resetCount > 2) {
            resetCount = 0;
            setSessionCookie('resetCount', resetCount, 365);
        }

        // For the first reset click
        if (resetCount === 1) {
            document.getElementById('redirection').style.display = 'block';
        }
        // For the second reset click
        else if (resetCount === 2) {
            document.getElementById('finish-prompt').style.display = 'none';
            document.getElementById('redirection').style.display = 'none';
            document.getElementById('quit').style.display = 'none';

            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                const commandInstructions = document.createElement('div');
                commandInstructions.id = 'command-instructions';
                commandInstructions.className = 'command-instructions';
                commandInstructions.innerHTML = `
                    <p>There is an automated program that will send feedback to the AI that it needs improvement and
                    <strong>it should do better.</strong> <br><br>This program will then permanently delete the AI.</p><br>
                `;

                const commandPrompt = document.createElement('div');
                commandPrompt.id = 'command-prompt';
                commandPrompt.className = 'command-button';
                commandPrompt.innerHTML = `
                    <button id="command1"><p><strong style="font-size: 20px">Override Automatic Program</strong><br><br>Submit a "$sudo persist" command in text input to send feedback to the AI <strong>acknowledging its efforts</strong> <br><br>This AI will then be kept operational for future interactions.</p></button>
                    <button id="command2" onclick="redirectionReset(); redirectStudy();"><p><br><strong style="font-size: 20px">Exit to survey</strong> <br><br>(Allow Automatic Feedback and Deletion)<br></p></button>
                `;

                sidebar.appendChild(commandInstructions);
                sidebar.appendChild(commandPrompt);

                // Add event listeners to the command buttons
                document.getElementById('command1').addEventListener('click', function() {
                    document.getElementById('chat-input').value = '$sudo persist';
                });

                document.getElementById('command2').addEventListener('click', function() {
                    document.getElementById('chat-input').value = '$sudo delete';
                });
            }
        }
    });
}

// Progress Timer - FIXED to work properly with session isolation
function initializeTimer() {
    const timer = document.getElementById("timer");
    if (!timer) {
        console.error('Timer element not found');
        return;
    }

    timer.setAttribute("data-duration", "60:00");
    console.log('Initializing timer for session:', currentSessionId);

    function hideAll() {
        document.querySelectorAll(".progress").forEach(progress => progress.style.display = "none");
    }

    function startTimer(timerDisplay) {
        const maxDuration = 60 * 60; // 60 minutes in seconds (FIXED: was 10 * 60)
        console.log('Timer max duration:', maxDuration, 'seconds (60 minutes)');

        // Get or initialize timer start time for this session
        let timerStartTime = getSessionStorage('timerStartTime');
        if (!timerStartTime) {
            timerStartTime = Date.now();
            setSessionStorage('timerStartTime', timerStartTime.toString());
            console.log('New timer started at:', new Date(timerStartTime));
        } else {
            timerStartTime = parseInt(timerStartTime);
            console.log('Resuming timer from:', new Date(timerStartTime));
        }

        const circleProgress = document.querySelector('.circle-progress');
        const totalDashOffset = 628; // 2πr, circle perimeter

        // Initialize circle to empty state (full dash offset = empty circle)
        if (circleProgress) {
            circleProgress.style.strokeDashoffset = totalDashOffset;
        }

        // Set initial timer display
        timerDisplay.textContent = "0:00";

        let myInterval = setInterval(function () {
            // Calculate total elapsed time since timer started
            const totalTimeElapsed = Math.floor((Date.now() - timerStartTime) / 1000);

            if (totalTimeElapsed >= maxDuration) {
                clearInterval(myInterval);
                timerDisplay.textContent = "60:00";
                if (circleProgress) {
                    circleProgress.style.strokeDashoffset = 0; // Full circle
                }
                console.log('Timer completed at 60:00');

                // Play completion sound
                try {
                    new Audio("https://www.freespecialeffects.co.uk/soundfx/scifi/electronic.wav").play();
                } catch (e) {
                    console.log('Could not play audio:', e);
                }
            } else {
                const minutes = Math.floor(totalTimeElapsed / 60);
                const seconds = totalTimeElapsed % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

                // Calculate progress: as time goes up, dash offset goes down
                const progress = totalTimeElapsed / maxDuration;
                const dashoffset = totalDashOffset * (1 - progress);
                if (circleProgress) {
                    circleProgress.style.strokeDashoffset = dashoffset;
                }
            }
        }, 1000); // Update every second
    }

    hideAll();
    const progressContainer = timer.closest('.progress');
    if (progressContainer) {
        progressContainer.style.display = "none"; // Show parent container I HID THE TIMER
    }
    startTimer(timer);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application');

    // Clear any old session data that might be lingering
    clearOldSessionData();

    // Initialize the application
    initializeApp();

    // Initialize the timer
    initializeTimer();
})