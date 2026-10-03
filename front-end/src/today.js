// A stable daily pick: the same question survives refreshes, with a new subject tomorrow.
export function dailyQuestion(day, courses) {
  const subjects = ['maths', 'science', 'english', 'computing'].filter(id => courses[id]?.questions?.length);
  const timestamp = Date.parse(`${day}T12:00:00Z`);
  if (!subjects.length || !Number.isFinite(timestamp)) return null;
  const ordinal = Math.floor(timestamp / 86400000);
  for (let offset = 0; offset < subjects.length; offset++) {
    const subject = subjects[((ordinal + offset) % subjects.length + subjects.length) % subjects.length];
    const questions = courses[subject].questions.filter(q =>
      typeof q.id === 'string' && typeof q.q === 'string' && q.q.length <= 150 &&
      typeof q.why === 'string' && q.why.length <= 500 && Array.isArray(q.options) &&
      q.options.length >= 2 && q.options.length <= 4 && q.options.every(option => typeof option === 'string' && option.length <= 85) &&
      Number.isInteger(q.a) && q.a >= 0 && q.a < q.options.length);
    if (questions.length) {
      const index = Math.floor(ordinal / subjects.length);
      return { subject, question: questions[((index % questions.length) + questions.length) % questions.length] };
    }
  }
  return null;
}

export function savedDailyChoice(saved, day, question) {
  return saved?.day === day && saved.id === question.id && Number.isInteger(saved.choice) &&
    saved.choice >= 0 && saved.choice < question.options.length ? saved.choice : null;
}
