const appRoot = document.querySelector("#app");
const state = {
  answers: new Array(window.courseData.quiz.questions.length).fill(null),
  currentQuestion: 0,
  lessonIndex: -1,
  lastScore: null,
  questionOrders: []
};

function getResultByScore(score) {
  return window.courseData.quiz.results.find(
    (item) => score >= item.min && score <= item.max
  );
}

function getAnsweredCount() {
  return state.answers.filter((answer) => answer !== null).length;
}

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildQuestionOrders() {
  state.questionOrders = window.courseData.quiz.questions.map((question) =>
    shuffleArray(
      question.options.map((option, optionIndex) => ({
        text: option,
        originalIndex: optionIndex
      }))
    )
  );
}

function renderStart() {
  const totalQuestions = window.courseData.quiz.questions.length;

  if (state.questionOrders.length === 0) {
    buildQuestionOrders();
  }

  appRoot.innerHTML = `
    <section class="card">
      <div class="hero-panel">
        <div class="hero-copy">
          <span class="section-tag">Тест</span>
          <h2>${window.courseData.quiz.title}</h2>
          <p>${window.courseData.quiz.intro}</p>
          <div class="hero-badges">
            <span>10 ситуаций из жизни</span>
            <span>1 балл за верный ответ</span>
            <span>Подходит подросткам</span>
          </div>
          <button class="primary-button" id="start-quiz">Начать тест</button>
        </div>
        <aside class="promo-card">
          <p class="promo-label">Что внутри</p>
          <div class="promo-number">${totalQuestions}</div>
          <p class="promo-title">вопросов с одним правильным вариантом</p>
          <div class="promo-grid">
            <div>
              <strong>4</strong>
              <span>итоговых результата</span>
            </div>
            <div>
              <strong>6</strong>
              <span>слайдов мини-курса</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  document
    .querySelector("#start-quiz")
    .addEventListener("click", () => renderQuestion(0));
}

function renderQuestion(index) {
  state.currentQuestion = index;
  const question = window.courseData.quiz.questions[index];
  const shuffledOptions = state.questionOrders[index];
  const progress = `${index + 1} / ${window.courseData.quiz.questions.length}`;
  const answered = getAnsweredCount();

  appRoot.innerHTML = `
    <section class="card">
      <div class="card-head">
        <span class="section-tag">Вопрос ${index + 1}</span>
        <span class="progress-label">${progress}</span>
      </div>
      <div class="meter-block">
        <div class="meter-track">
          <span style="width: ${((index + 1) / window.courseData.quiz.questions.length) * 100}%"></span>
        </div>
        <p class="meta-line">Отвечено: <strong>${answered}</strong> из ${window.courseData.quiz.questions.length}</p>
      </div>
      <h2 class="question-title">${question.prompt}</h2>
      <form id="quiz-form" class="options-list">
        ${question.options
          .map((_, optionIndex) => shuffledOptions[optionIndex])
          .map(
            (option, optionIndex) => `
              <label class="option-item">
                <input
                  type="radio"
                  name="answer"
                  value="${option.originalIndex}"
                  ${state.answers[index] === option.originalIndex ? "checked" : ""}
                />
                <span>${option.text}</span>
              </label>
            `
          )
          .join("")}
      </form>
      <div class="actions">
        <button class="secondary-button action-secondary" id="prev-question" ${
          index === 0 ? "disabled" : ""
        }>Назад</button>
        <button class="primary-button action-primary" id="next-question">${
          index === window.courseData.quiz.questions.length - 1
            ? "Посмотреть результат"
            : "Дальше"
        }</button>
      </div>
    </section>
  `;

  const form = document.querySelector("#quiz-form");
  const nextButton = document.querySelector("#next-question");
  const prevButton = document.querySelector("#prev-question");

  prevButton.addEventListener("click", () => {
    if (index > 0) {
      saveAnswer(form, index);
      renderQuestion(index - 1);
    }
  });

  nextButton.addEventListener("click", () => {
    const selected = saveAnswer(form, index);

    if (selected === null) {
      showInlineNotice("Выберите один вариант ответа, чтобы продолжить.");
      return;
    }

    if (index === window.courseData.quiz.questions.length - 1) {
      renderResult();
      return;
    }

    renderQuestion(index + 1);
  });
}

function saveAnswer(form, questionIndex) {
  const selected = form.querySelector('input[name="answer"]:checked');
  const value = selected ? Number(selected.value) : null;
  state.answers[questionIndex] = value;
  return value;
}

function showInlineNotice(text) {
  let note = document.querySelector(".inline-notice");

  if (!note) {
    note = document.createElement("p");
    note.className = "inline-notice";
    appRoot.querySelector(".card").appendChild(note);
  }

  note.textContent = text;
}

function renderResult() {
  const score = state.answers.reduce((total, answer, index) => {
    return total + (answer === window.courseData.quiz.questions[index].correctIndex ? 1 : 0);
  }, 0);
  state.lastScore = score;

  const result = getResultByScore(score);
  const recommendations = window.courseData.lessons.slides.slice(0, 3).map((lesson) => lesson.title);

  appRoot.innerHTML = `
    <section class="card">
      <div class="result-layout">
        <div class="result-hero">
          <span class="section-tag">Результат теста</span>
          ${result.hideTitle ? "" : `<h2>${result.title}</h2>`}
          <p class="score-line">Ваш результат: <strong>${score} из 10</strong></p>
          <div class="summary-box compact-box">
            <div>
              <strong>${score}</strong>
              <span>правильных ответов</span>
            </div>
            <div>
              <strong>${10 - score}</strong>
              <span>точек роста</span>
            </div>
          </div>
        </div>
        <div class="result-image-box">
          <img class="result-image ${result.imageClass || ""}" src="${result.image}" alt="${result.title}" />
        </div>
        ${
          result.hideResultText
            ? ""
            : `<div class="result-text">
          ${result.hideDescription ? "" : `<p>${result.description}</p>`}
          <p>Дальше можно перейти к вводной части и пяти урокам мини-курса. Они помогут закрепить сильные стороны и закрыть пробелы.</p>
          <div class="mini-list">
            <span>В курсе мы расскажем:</span>
            ${recommendations.map((item) => `<strong>${item}</strong>`).join("")}
          </div>
        </div>`
        }
      </div>
      <div class="actions">
        <button class="secondary-button action-secondary" id="restart-quiz">Пройти тест заново</button>
        <button class="primary-button action-primary" id="go-lessons">Перейти к урокам</button>
      </div>
    </section>
  `;

  document.querySelector("#restart-quiz").addEventListener("click", () => {
    state.answers.fill(null);
    buildQuestionOrders();
    renderStart();
  });

  document.querySelector("#go-lessons").addEventListener("click", () => {
    state.lessonIndex = -1;
    renderLesson();
  });
}

function getCurrentLessonData() {
  if (state.lessonIndex === -1) {
    return {
      kind: "intro",
      title: window.courseData.lessons.intro.title,
      subtitle: "Вводная часть курса",
      content: window.courseData.lessons.intro.content,
      image: window.courseData.lessons.intro.image
    };
  }

  const lesson = window.courseData.lessons.slides[state.lessonIndex];
  return {
    kind: "lesson",
    title: `${lesson.step}. ${lesson.title}`,
    subtitle: lesson.subtitle,
    content: lesson.content,
    image: lesson.image || null
  };
}

function renderLesson() {
  const lessonData = getCurrentLessonData();
  const totalScreens = window.courseData.lessons.slides.length + 1;
  const currentScreen = state.lessonIndex + 2;
  const isLastLesson = state.lessonIndex === window.courseData.lessons.slides.length - 1;

  appRoot.innerHTML = `
    <section class="card">
      <div class="card-head">
        <span class="section-tag">Уроки</span>
        <span class="progress-label">${currentScreen} / ${totalScreens}</span>
      </div>
      <h2 class="lesson-title">${lessonData.title}</h2>
      <p class="lesson-subtitle">${lessonData.subtitle}</p>
      <div class="lesson-layout">
        ${
          lessonData.image
            ? `<div class="result-image-box"><img class="result-image" src="${lessonData.image}" alt="${lessonData.title}" /></div>`
            : `<div class="placeholder-box placeholder-box--soft">Заглушка для изображения блока</div>`
        }
        <div class="lesson-text">
          ${lessonData.content.map((item) => `<p>${item}</p>`).join("")}
        </div>
      </div>
      <div class="actions">
        <button class="secondary-button action-secondary" id="prev-lesson">${
          state.lessonIndex === -1 ? "К результату" : "Назад"
        }</button>
        <button class="primary-button action-primary" id="next-lesson">${
          isLastLesson ? "Финал курса" : "Дальше"
        }</button>
      </div>
    </section>
  `;

  document.querySelector("#prev-lesson").addEventListener("click", () => {
    if (state.lessonIndex === -1) {
      renderResult();
      return;
    }

    state.lessonIndex -= 1;
    renderLesson();
  });

  document.querySelector("#next-lesson").addEventListener("click", () => {
    if (isLastLesson) {
      renderOutro();
      return;
    }

    state.lessonIndex += 1;
    renderLesson();
  });
}

function renderOutro() {
  appRoot.innerHTML = `
    <section class="card">
      <span class="section-tag">Финал курса</span>
      <h2>${window.courseData.lessons.outro.title}</h2>
      <div class="lesson-layout">
        <div class="result-image-box">
          <img class="result-image result-image--hero" src="${window.courseData.lessons.outro.image}" alt="${window.courseData.lessons.outro.title}" />
        </div>
        <div class="lesson-text">
          ${window.courseData.lessons.outro.content
            .map((item) => `<p>${item}</p>`)
            .join("")}
        </div>
      </div>
      <section class="rules-block">
        <h3>Основные правила</h3>
        <div class="check-grid check-grid--highlight">
          <div class="check-item check-item--accent">Не спешить и не действовать под давлением</div>
          <div class="check-item check-item--accent">Проверять ссылки, сайты и продавцов</div>
          <div class="check-item check-item--accent">Беречь пароли и личные данные</div>
          <div class="check-item check-item--accent">Не скачивать подозрительные файлы</div>
          <div class="check-item check-item--accent">Перепроверять ответы нейросетей</div>
          <div class="check-item check-item--accent">Не оставаться с проблемой один на один</div>
        </div>
      </section>
      <div class="actions">
        <button class="secondary-button action-secondary" id="back-to-lessons">К урокам</button>
        <button class="primary-button action-primary" id="restart-all">Пройти тест еще раз</button>
      </div>
    </section>
  `;

  document.querySelector("#back-to-lessons").addEventListener("click", () => {
    state.lessonIndex = window.courseData.lessons.slides.length - 1;
    renderLesson();
  });

  document.querySelector("#restart-all").addEventListener("click", () => {
    state.answers.fill(null);
    state.currentQuestion = 0;
    state.lessonIndex = -1;
    buildQuestionOrders();
    renderQuestion(0);
  });
}

buildQuestionOrders();
renderStart();
