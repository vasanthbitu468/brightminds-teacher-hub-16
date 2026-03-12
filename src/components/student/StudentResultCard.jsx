import React, { useMemo } from 'react';

const getAnswers = (attempt) => {
  const fromAnswers = Array.isArray(attempt?.submission_data?.answers)
    ? attempt.submission_data.answers
    : [];

  if (fromAnswers.length > 0) {
    return fromAnswers.map((item, index) => ({
      key: `ans-${index}`,
      question: item?.question || `Question ${index + 1}`,
      student_answer: item?.student_answer ?? 'Not answered',
      correct_answer: item?.correct_answer ?? '-',
      is_correct: Boolean(item?.is_correct),
    }));
  }

  const questionRows = Array.isArray(attempt?.submission_data?.question_level_data)
    ? attempt.submission_data.question_level_data
    : [];

  return questionRows.map((item, index) => ({
    key: `row-${item?.question_id || index}`,
    question: item?.question_text || `Question ${Number(item?.question_index ?? index) + 1}`,
    student_answer: item?.student_selected_answer ?? item?.student_answer ?? 'Not answered',
    correct_answer: item?.correct_answer ?? '-',
    is_correct: Boolean(item?.is_correct),
  }));
};

const getPerformanceMessage = (accuracy) => {
  if (accuracy >= 90) return 'Excellent 🎉';
  if (accuracy >= 70) return 'Good Job 👍';
  if (accuracy >= 50) return 'Keep Practicing 📚';
  return 'Needs Improvement 💪';
};

const StudentResultCard = ({ assignment, attempt }) => {
  const { score, totalQuestions, accuracy, feedback } = useMemo(() => {
    const answersData = getAnswers(attempt);

    const teacherReview = attempt?.submission_data?.teacher_review || {};
    const fromTeacherScore = Number.isFinite(Number(teacherReview?.achieved_marks))
      ? Number(teacherReview.achieved_marks)
      : null;
    const fromTeacherTotal = Number.isFinite(Number(teacherReview?.total_marks))
      ? Number(teacherReview.total_marks)
      : null;

    const fallbackTotal = answersData.length;
    const fallbackScore = answersData.filter((item) => item.is_correct).length;

    const resolvedScore = fromTeacherScore ?? (Number.isFinite(Number(attempt?.score)) ? Number(attempt.score) : fallbackScore);
    const resolvedTotal = fromTeacherTotal ?? (Number.isFinite(Number(attempt?.max_score)) ? Number(attempt.max_score) : fallbackTotal);
    const safeTotal = resolvedTotal > 0 ? resolvedTotal : 0;
    const safeScore = resolvedScore >= 0 ? resolvedScore : 0;
    const resolvedAccuracy = safeTotal > 0 ? Math.round((safeScore / safeTotal) * 100) : 0;

    return {
      score: safeScore,
      totalQuestions: safeTotal,
      accuracy: resolvedAccuracy,
      feedback: attempt?.feedback || 'No feedback provided yet.',
    };
  }, [attempt]);

  const performanceText = getPerformanceMessage(accuracy);

  return (
    <div className="result-card rounded-xl bg-white p-5 shadow-[0px_4px_12px_rgba(0,0,0,0.08)] border border-slate-100 mb-4">
      <div className="result-header flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{assignment.title}</h2>
          {assignment?.due_date && (
            <p className="text-sm text-slate-500 mt-1">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
          )}
        </div>
        <span className="result-badge success rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
          Result Published
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-indigo-200 border-l-4 border-l-indigo-600 bg-indigo-50 p-4">
        <h3 className="text-base font-bold text-indigo-900">Teacher Feedback</h3>
        <p className="mt-2 text-sm text-slate-800">{feedback}</p>
      </div>

      <div className="result-stats mt-4 flex flex-wrap gap-4 justify-between">
        <div className="stat-box min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">📊 Score</p>
          <h3 className="text-xl font-bold text-slate-900">{score}/{totalQuestions}</h3>
        </div>

        <div className="stat-box min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">📈 Accuracy</p>
          <h3 className="text-xl font-bold text-slate-900">{accuracy}%</h3>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-indigo-700">{performanceText}</p>

      <div className="score-progress mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="score-fill h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(accuracy, 100))}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StudentResultCard;
