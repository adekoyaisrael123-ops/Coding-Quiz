
document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // QUIZ STATE
    // =====================================================

    let currentCategory = "";
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let selectedAnswer = false;


    // =====================================================
    // QUIZ ELEMENTS
    // =====================================================

    const quizSection = document.getElementById("quiz-section");
    const quizTitle = document.getElementById("quiz-title");
    const questionElement = document.getElementById("question");
    const answersElement = document.getElementById("answers");
    const nextButton = document.getElementById("next-button");
    const resultElement = document.getElementById("result");
    const scoreElement = document.getElementById("score");
    const restartButton = document.getElementById("restart-button");

    const currentQuestionElement =
        document.getElementById("current-question");

    const totalQuestionsElement =
        document.getElementById("total-questions");

    const quizLoading =
        document.getElementById("quiz-loading");

    const quizError =
        document.getElementById("quiz-error");

    const errorMessage =
        document.getElementById("error-message");

    const retryButton =
        document.getElementById("retry-button");


    // =====================================================
    // AI ELEMENTS
    // =====================================================

    const sendButton =
        document.getElementById("sendButton");

    const messageInput =
        document.getElementById("message");

    const loadingElement =
        document.getElementById("loading");

    const responseElement =
        document.getElementById("response");


    // =====================================================
    // START QUIZ BUTTONS
    // =====================================================

    const startButtons =
        document.querySelectorAll(".row-btn");


    startButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const category =
                button.dataset.category;

            if (!category) {

                showError(
                    "Quiz category was not found."
                );

                return;
            }

            startQuiz(category);

        });

    });


    // =====================================================
    // START QUIZ
    // =====================================================

    async function startQuiz(category) {

        currentCategory = category;
        currentQuestionIndex = 0;
        score = 0;
        questions = [];
        selectedAnswer = false;


        quizSection.style.display = "block";

        quizTitle.textContent =
            `${category} Quiz`;


        questionElement.style.display = "block";
        answersElement.style.display = "flex";

        resultElement.style.display = "none";

        if (quizError) {
            quizError.style.display = "none";
        }

        nextButton.style.display = "none";
        nextButton.disabled = true;


        questionElement.textContent =
            "Generating your quiz...";

        answersElement.innerHTML = "";


        if (quizLoading) {
            quizLoading.style.display = "block";
        }


        quizSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        try {

            const response =
                await fetch("/api/generate-quiz", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        category: category,
                        numberOfQuestions: 5

                    })

                });


            const contentType =
                response.headers.get("content-type") || "";


            let data;


            if (
                contentType.includes("application/json")
            ) {

                data = await response.json();

            } else {

                throw new Error(
                    `Server returned an unexpected response (${response.status}).`
                );

            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    `Server error: ${response.status}`
                );

            }


            if (
                !data ||
                !Array.isArray(data.questions)
            ) {

                throw new Error(
                    "The server did not return a valid quiz."
                );

            }


            if (data.questions.length === 0) {

                throw new Error(
                    "No questions were generated."
                );

            }


            questions =
                data.questions;


            totalQuestionsElement.textContent =
                questions.length;


            if (quizLoading) {
                quizLoading.style.display = "none";
            }


            // IMPORTANT
            // Show the first question
            showQuestion();


        } catch (error) {

            console.error(
                "Quiz Error:",
                error
            );


            if (quizLoading) {
                quizLoading.style.display = "none";
            }


            showError(
                getFetchErrorMessage(error)
            );

        }

    }


    // =====================================================
    // SHOW QUESTION
    // =====================================================

    function showQuestion() {

        resultElement.style.display = "none";

        questionElement.style.display = "block";

        // Keep answers vertical
        answersElement.style.display = "flex";
        answersElement.style.flexDirection = "column";
        answersElement.style.gap = "15px";


        nextButton.style.display = "none";
        nextButton.disabled = true;


        selectedAnswer = false;


        const currentQuestion =
            questions[currentQuestionIndex];


        if (!currentQuestion) {

            showResult();

            return;
        }


        // =================================================
        // QUESTION NUMBER
        // =================================================

        currentQuestionElement.textContent =
            currentQuestionIndex + 1;

        totalQuestionsElement.textContent =
            questions.length;


        // =================================================
        // QUESTION TEXT
        // =================================================

        questionElement.textContent =
            currentQuestion.question ||
            "Question unavailable.";


        // =================================================
        // CLEAR OLD ANSWERS
        // =================================================

        answersElement.innerHTML = "";


        // =================================================
        // CHECK OPTIONS
        // =================================================

        if (
            !Array.isArray(currentQuestion.options) ||
            currentQuestion.options.length === 0
        ) {

            answersElement.innerHTML =
                `<p class="error-message">
                    No answer options were provided.
                </p>`;

            return;
        }


        // =================================================
        // CREATE ANSWER BUTTONS
        // =================================================

        currentQuestion.options.forEach(
            (option, index) => {

                const optionText =
                    getOptionText(option);


                const button =
                    document.createElement("button");


                button.type = "button";


                button.className =
                    "answer-button";


                // A. Answer
                // B. Answer
                // C. Answer
                // D. Answer

                button.textContent =
                    `${String.fromCharCode(65 + index)}. ${optionText}`;


                // Store the answer
                button.dataset.answer =
                    optionText;


                // Store its position
                button.dataset.index =
                    index;


                // When clicked
                button.addEventListener(
                    "click",
                    () => {

                        selectAnswer(
                            button,
                            option
                        );

                    }
                );


                answersElement.appendChild(
                    button
                );

            }
        );

    }


    // =====================================================
    // SELECT ANSWER
    // =====================================================

    function selectAnswer(
        selectedButton,
        selectedOption
    ) {

        // Don't allow another selection
        if (selectedAnswer) {
            return;
        }


        selectedAnswer = true;


        const currentQuestion =
            questions[currentQuestionIndex];


        const selectedText =
            getOptionText(selectedOption);


        const correctAnswer =
            getCorrectAnswer(currentQuestion);


        const allButtons =
            answersElement.querySelectorAll(
                ".answer-button"
            );


        // =================================================
        // DISABLE ALL OPTIONS
        // =================================================

        allButtons.forEach((button) => {

            button.disabled = true;

        });


        // =================================================
        // FIND CORRECT ANSWER BUTTON
        // =================================================

        let correctButton = null;


        allButtons.forEach((button) => {

            const buttonAnswer =
                button.dataset.answer;


            if (
                normalizeAnswer(buttonAnswer) ===
                normalizeAnswer(correctAnswer)
            ) {

                correctButton = button;

            }

        });


        // =================================================
        // CHECK ANSWER
        // =================================================

        const isCorrect =
            normalizeAnswer(selectedText) ===
            normalizeAnswer(correctAnswer);


        // =================================================
        // USER SELECTED CORRECT ANSWER
        // =================================================

        if (isCorrect) {

            score++;


            selectedButton.classList.add(
                "correct"
            );

        }


        // =================================================
        // USER SELECTED WRONG ANSWER
        // =================================================

        else {

            // User's answer = RED
            selectedButton.classList.add(
                "incorrect"
            );


            // Correct answer = GREEN
            if (correctButton) {

                correctButton.classList.add(
                    "correct"
                );

            }

        }


        // =================================================
        // SHOW FEEDBACK
        // =================================================

        showFeedback(
            currentQuestion,
            selectedOption,
            isCorrect,
            correctAnswer
        );


        // =================================================
        // SHOW NEXT BUTTON
        // =================================================

        nextButton.disabled = false;

        nextButton.style.display = "block";


        if (
            currentQuestionIndex ===
            questions.length - 1
        ) {

            nextButton.textContent =
                "See Result 🏆";

        } else {

            nextButton.textContent =
                "Next Question →";

        }

    }


    // =====================================================
    // NEXT QUESTION
    // =====================================================

    nextButton.addEventListener(
        "click",
        () => {

            if (nextButton.disabled) {
                return;
            }


            currentQuestionIndex++;


            if (
                currentQuestionIndex >=
                questions.length
            ) {

                showResult();

                return;
            }


            showQuestion();

        }
    );


    // =====================================================
    // SHOW RESULT
    // =====================================================

    function showResult() {

        questionElement.style.display =
            "none";

        answersElement.style.display =
            "none";

        nextButton.style.display =
            "none";

        nextButton.disabled =
            true;


        resultElement.style.display =
            "block";


        const total =
            questions.length;


        const percentage =
            total > 0
                ? Math.round((score / total) * 100)
                : 0;


        scoreElement.innerHTML =
            `You scored <strong>${score}</strong> out of <strong>${total}</strong> (${percentage}%).`;


        if (percentage >= 80) {

            scoreElement.innerHTML +=
                "<br><br>🎉 Excellent work!";

        }

        else if (percentage >= 50) {

            scoreElement.innerHTML +=
                "<br><br>👍 Good job! Keep practicing.";

        }

        else {

            scoreElement.innerHTML +=
                "<br><br>📚 Keep studying and try again.";

        }

    }


    // =====================================================
    // RESTART QUIZ
    // =====================================================

    if (restartButton) {

        restartButton.addEventListener(
            "click",
            () => {

                resetQuiz();


                document
                    .getElementById("quiz-area")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    // =====================================================
    // RESET QUIZ
    // =====================================================

    function resetQuiz() {

        currentCategory = "";
        currentQuestionIndex = 0;
        score = 0;
        questions = [];
        selectedAnswer = false;


        quizTitle.textContent =
            "Select a Category";


        questionElement.style.display =
            "block";


        questionElement.textContent =
            "Select a category to start the quiz.";


        answersElement.style.display =
            "flex";

        answersElement.style.flexDirection =
            "column";

        answersElement.style.gap =
            "15px";


        answersElement.innerHTML =
            "";


        nextButton.style.display =
            "none";

        nextButton.disabled =
            true;


        resultElement.style.display =
            "none";


        if (quizError) {
            quizError.style.display =
                "none";
        }


        if (quizLoading) {

            quizLoading.style.display =
                "none";

        }


        currentQuestionElement.textContent =
            "0";


        totalQuestionsElement.textContent =
            "0";

    }


    // =====================================================
    // RETRY BUTTON
    // =====================================================

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                if (currentCategory) {

                    startQuiz(
                        currentCategory
                    );

                }

            }
        );

    }


    // =====================================================
    // SHOW ERROR
    // =====================================================

    function showError(message) {

        if (quizError) {

            quizError.style.display =
                "block";

        }


        if (errorMessage) {

            errorMessage.textContent =
                message;

        }


        questionElement.textContent =
            "Unable to load the quiz.";


        answersElement.innerHTML =
            "";


        nextButton.style.display =
            "none";

        nextButton.disabled =
            true;

    }


    // =====================================================
    // FETCH ERROR MESSAGE
    // =====================================================

    function getFetchErrorMessage(error) {

        const message =
            String(error.message || error);


        if (
            message.toLowerCase().includes(
                "failed to fetch"
            )
        ) {

            return (
                "Cannot connect to the quiz server. " +
                "Make sure server.js is running on http://localhost:5000."
            );

        }


        if (
            message.toLowerCase().includes(
                "networkerror"
            )
        ) {

            return (
                "Network error. Please make sure the Node.js server is running."
            );

        }


        return message;

    }


    // =====================================================
    // AI ASSISTANT
    // =====================================================

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            askAI
        );

    }


    // Ctrl + Enter
    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {

                    askAI();

                }

            }
        );

    }


    // =====================================================
    // ASK AI
    // =====================================================

    async function askAI() {

        if (!messageInput) {
            return;
        }


        const message =
            messageInput.value.trim();


        if (!message) {

            responseElement.textContent =
                "Please enter a coding question.";

            return;

        }


        if (loadingElement) {

            loadingElement.style.display =
                "block";

        }


        responseElement.textContent =
            "";


        sendButton.disabled =
            true;


        try {

            const response =
                await fetch("/api/ask-ai", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: message

                    })

                });


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                throw new Error(
                    `Server returned an unexpected response (${response.status}).`
                );

            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "AI request failed."
                );

            }


            responseElement.textContent =
                data.reply ||
                data.response ||
                "No response received.";


        } catch (error) {

            console.error(
                "AI Error:",
                error
            );


            responseElement.textContent =
                `Error: ${getFetchErrorMessage(error)}`;

        }


        finally {

            if (loadingElement) {

                loadingElement.style.display =
                    "none";

            }


            sendButton.disabled =
                false;

        }

    }


    // =====================================================
    // GET OPTION TEXT
    // =====================================================

    function getOptionText(option) {

        if (
            typeof option === "string"
        ) {

            return option.trim();

        }


        if (
            typeof option === "number"
        ) {

            return String(option);

        }


        if (!option) {

            return "";

        }


        if (
            option.label !== undefined
        ) {

            return String(option.label).trim();

        }


        if (
            option.text !== undefined
        ) {

            return String(option.text).trim();

        }


        if (
            option.value !== undefined
        ) {

            return String(option.value).trim();

        }


        return "";

    }


    // =====================================================
    // GET CORRECT ANSWER
    // =====================================================

    function getCorrectAnswer(question) {

        if (
            !question ||
            !Array.isArray(question.options)
        ) {

            return "";

        }


        // Try correctAnswer first
        let answer =
            question.correctAnswer;


        // If correctAnswer doesn't exist,
        // try correct
        if (
            answer === undefined ||
            answer === null
        ) {

            answer =
                question.correct;

        }


        // If neither exists, try answer
        if (
            answer === undefined ||
            answer === null
        ) {

            answer =
                question.answer;

        }


        if (
            answer === undefined ||
            answer === null
        ) {

            return "";

        }


        // =================================================
        // NUMBER
        // =================================================

        if (
            typeof answer === "number"
        ) {

            if (
                question.options[answer] !== undefined
            ) {

                return getOptionText(
                    question.options[answer]
                );

            }

        }


        // =================================================
        // STRING
        // =================================================

        if (
            typeof answer === "string"
        ) {

            const trimmed =
                answer.trim();


            // A / B / C / D
            if (
                /^[A-D]$/i.test(trimmed)
            ) {

                const index =
                    trimmed
                        .toUpperCase()
                        .charCodeAt(0) - 65;


                if (
                    question.options[index] !== undefined
                ) {

                    return getOptionText(
                        question.options[index]
                    );

                }

            }


            // Direct answer text
            const matchingOption =
                question.options.find(
                    (option) => {

                        return (
                            normalizeAnswer(
                                getOptionText(option)
                            ) ===
                            normalizeAnswer(trimmed)
                        );

                    }
                );


            if (
                matchingOption !== undefined
            ) {

                return getOptionText(
                    matchingOption
                );

            }


            return trimmed;

        }


        return "";

    }


    // =====================================================
    // NORMALIZE ANSWER
    // =====================================================

    function normalizeAnswer(answer) {

        return String(answer || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    }


    // =====================================================
    // SHOW FEEDBACK
    // =====================================================

    function showFeedback(
        question,
        selectedOption,
        isCorrect,
        correctAnswer
    ) {

        let feedback = "";


        // Check if the selected option has feedback
        if (
            selectedOption &&
            typeof selectedOption === "object" &&
            selectedOption.feedback
        ) {

            feedback =
                selectedOption.feedback;

        }


        // Default feedback
        if (!feedback) {

            if (isCorrect) {

                feedback =
                    "Correct! 🎉";

            } else {

                feedback =
                    `Wrong answer ❌ The correct answer is: ${correctAnswer}`;

            }

        }


        const feedbackElement =
            document.createElement("div");


        feedbackElement.className =
            isCorrect
                ? "answer-feedback correct-feedback"
                : "answer-feedback incorrect-feedback";


        feedbackElement.textContent =
            feedback;


        answersElement.appendChild(
            feedbackElement
        );

    }


    // =====================================================
    // INITIAL STATE
    // =====================================================

    quizSection.style.display =
        "block";


    resultElement.style.display =
        "none";


    nextButton.style.display =
        "none";


    // Make answer area vertical
    answersElement.style.display =
        "flex";

    answersElement.style.flexDirection =
        "column";

    answersElement.style.gap =
        "15px";

});

