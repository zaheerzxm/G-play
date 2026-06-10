import { TRIVIA_QUESTIONS } from "./triviaQuestions.js";

const QUESTION_COUNT = 5;
const QUESTION_MS = 15000;
const REVEAL_MS = 3500;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createTriviaGame({ roomId, hostUserId, players }) {
  const questions = shuffle(TRIVIA_QUESTIONS).slice(0, QUESTION_COUNT);
  const scores = {};
  for (const p of players) scores[p.userId] = 0;

  const state = {
    questionIndex: 0,
    questions,
    answers: {},
  };

  const game = {
    type: "trivia",
    roomId,
    hostUserId,
    phase: "waiting",
    readyUserIds: new Set(),
    scores,
    players: players.map((p) => ({ userId: p.userId, userName: p.userName })),
    timers: [],
    startedAt: Date.now(),
    endsAt: null,
    _state: state,

    snapshot() {
      const q = state.questions[state.questionIndex];
      return {
        type: "trivia",
        phase: this.phase,
        questionIndex: state.questionIndex,
        totalQuestions: state.questions.length,
        question: q
          ? {
              text: q.text,
              options: q.options,
              ...(this.phase === "reveal" ? { correctIndex: q.correctIndex } : {}),
            }
          : null,
        scores: { ...scores },
        answers: this.phase === "reveal" ? { ...state.answers } : undefined,
        players: this.players,
        readyUserIds: [...this.readyUserIds],
        endsAt: this.endsAt ?? null,
        hostUserId,
      };
    },

    toPublic() {
      return this.snapshot();
    },

    clearTimers() {
      for (const t of this.timers) clearTimeout(t);
      this.timers = [];
    },

    destroy() {
      this.clearTimers();
    },
  };

  return game;
}

export function startTriviaQuestion(game, io, roomId) {
  game.clearTimers();
  const state = game._state;
  game.phase = "question";
  state.answers = {};
  const q = state.questions[state.questionIndex];
  if (!q) {
    game.phase = "finished";
    io.to(`room:${roomId}`).emit("gameStateUpdate", game.snapshot());
    return;
  }

  game.endsAt = Date.now() + QUESTION_MS;
  io.to(`room:${roomId}`).emit("gameStateUpdate", game.snapshot());

  const revealTimer = setTimeout(() => {
    revealTriviaAnswers(game, io, roomId);
  }, QUESTION_MS);
  game.timers.push(revealTimer);
}

function revealTriviaAnswers(game, io, roomId) {
  const state = game._state;
  game.phase = "reveal";
  const q = state.questions[state.questionIndex];
  for (const [userId, answerIndex] of Object.entries(state.answers)) {
    if (answerIndex === q.correctIndex) {
      game.scores[userId] = (game.scores[userId] ?? 0) + 100;
    }
  }
  io.to(`room:${roomId}`).emit("gameStateUpdate", game.snapshot());

  const nextTimer = setTimeout(() => {
    state.questionIndex += 1;
    if (state.questionIndex >= state.questions.length) {
      game.phase = "finished";
      io.to(`room:${roomId}`).emit("gameStateUpdate", game.snapshot());
      return;
    }
    startTriviaQuestion(game, io, roomId);
  }, REVEAL_MS);
  game.timers.push(nextTimer);
}

export function handleTriviaAnswer(game, userId, answerIndex) {
  if (game.phase !== "question") return false;
  const state = game._state;
  if (state.answers[userId] !== undefined) return false;
  const idx = Number(answerIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx > 3) return false;
  state.answers[userId] = idx;
  return true;
}
