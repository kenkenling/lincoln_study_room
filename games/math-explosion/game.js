const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const feedbackEl = document.getElementById("feedback");
const submitBtn = document.getElementById("submitBtn");
const startBtn = document.getElementById("startBtn");

let score = 0;
let timeLeft = 60;
let timerId = null;
let currentAnswer = null;
let running = false;

function nextQuestion() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const ops = ["+", "-", "x"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === "+") currentAnswer = a + b;
  if (op === "-") currentAnswer = a - b;
  if (op === "x") currentAnswer = a * b;

  questionEl.textContent = `${a} ${op} ${b} = ?`;
}

function updateHud() {
  timeEl.textContent = String(timeLeft);
  scoreEl.textContent = String(score);
}

function endGame() {
  running = false;
  clearInterval(timerId);
  timerId = null;
  answerEl.disabled = true;
  submitBtn.disabled = true;
  startBtn.disabled = false;
  questionEl.textContent = "Time Up!";
  feedbackEl.textContent = `Final Score: ${score}`;
}

function startGame() {
  score = 0;
  timeLeft = 60;
  running = true;
  updateHud();
  feedbackEl.textContent = "";
  answerEl.value = "";
  answerEl.disabled = false;
  submitBtn.disabled = false;
  startBtn.disabled = true;
  nextQuestion();
  answerEl.focus();

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    updateHud();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function submitAnswer() {
  if (!running) return;
  const value = Number(answerEl.value);
  if (Number.isNaN(value)) return;

  if (value === currentAnswer) {
    score += 10;
    feedbackEl.textContent = "Correct!";
  } else {
    feedbackEl.textContent = `Nope. Answer was ${currentAnswer}`;
  }

  updateHud();
  answerEl.value = "";
  nextQuestion();
  answerEl.focus();
}

submitBtn.addEventListener("click", submitAnswer);
startBtn.addEventListener("click", startGame);
answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitAnswer();
});
